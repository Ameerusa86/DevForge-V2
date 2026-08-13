import { readFileSync } from "fs";
import { resolve } from "path";
import pg from "pg";

function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

const connectionString =
  process.env.DIRECT_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ No database connection string found.");
  process.exit(1);
}

const client = new pg.Client({ connectionString });

async function main() {
  console.log("🔌 Connecting to DB...");
  await client.connect();

  console.log("🛠️ Converting course.category to text (preserving data)...");
  await client.query(`
    ALTER TABLE "course" ALTER COLUMN "category" TYPE text USING "category"::text;
  `);

  console.log("🛠️ Creating course_category table if not exists...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS "course_category" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL UNIQUE,
      "description" TEXT,
      "icon" TEXT DEFAULT 'BookOpen',
      "color" TEXT DEFAULT 'orange',
      "order" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS "course_category_order_idx" ON "course_category"("order");
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS "course_category_isActive_idx" ON "course_category"("isActive");
  `);

  console.log("🌱 Seeding default categories...");
  const defaults = [
    {
      id: "cat-frontend",
      name: "Frontend",
      slug: "FRONTEND",
      description: "Modern client-side engineering, responsive UI, design systems, and web apps.",
      icon: "MonitorPlay",
      color: "violet",
      order: 0,
    },
    {
      id: "cat-backend",
      name: "Backend",
      slug: "BACKEND",
      description: "Server architectures, distributed systems, REST/GraphQL APIs, and microservices.",
      icon: "Database",
      color: "blue",
      order: 1,
    },
    {
      id: "cat-fullstack",
      name: "Full Stack",
      slug: "FULL_STACK",
      description: "End-to-end full stack development connecting robust databases to reactive frontends.",
      icon: "Layers3",
      color: "orange",
      order: 2,
    },
    {
      id: "cat-python",
      name: "Python",
      slug: "PYTHON",
      description: "Data structures, automation, scientific computing, AI pipelines, and web frameworks.",
      icon: "Code2",
      color: "emerald",
      order: 3,
    },
    {
      id: "cat-powershell",
      name: "PowerShell",
      slug: "POWERSHELL",
      description: "Automation, cloud infrastructure scripting, DevOps pipelines, and systems management.",
      icon: "Terminal",
      color: "sky",
      order: 4,
    },
    {
      id: "cat-javascript",
      name: "JavaScript",
      slug: "JAVASCRIPT",
      description: "Core JavaScript semantics, ESNext features, asynchronous patterns, and browser runtimes.",
      icon: "Braces",
      color: "yellow",
      order: 5,
    },
    {
      id: "cat-typescript",
      name: "TypeScript",
      slug: "TYPESCRIPT",
      description: "Type safety, advanced generics, compiler options, and large-scale application design.",
      icon: "Braces",
      color: "cyan",
      order: 6,
    },
    {
      id: "cat-csharp",
      name: "C#",
      slug: "CSHARP",
      description: "Object-oriented programming, modern C# language features, LINQ, and enterprise systems.",
      icon: "Code2",
      color: "purple",
      order: 7,
    },
    {
      id: "cat-dotnet",
      name: ".NET",
      slug: "DOT_NET",
      description: "Cross-platform .NET runtime, Entity Framework Core, performance tuning, and CLR internals.",
      icon: "Globe",
      color: "indigo",
      order: 8,
    },
    {
      id: "cat-aspnet",
      name: "ASP.NET",
      slug: "ASP_NET",
      description: "High-throughput web APIs, Razor pages, Blazor, SignalR, and microservices with ASP.NET Core.",
      icon: "Globe",
      color: "teal",
      order: 9,
    },
  ];

  for (const cat of defaults) {
    await client.query(
      `
      INSERT INTO "course_category" ("id", "name", "slug", "description", "icon", "color", "order", "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT ("slug") DO UPDATE SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "icon" = EXCLUDED."icon",
        "color" = EXCLUDED."color",
        "order" = EXCLUDED."order";
    `,
      [cat.id, cat.name, cat.slug, cat.description, cat.icon, cat.color, cat.order, true]
    );
  }

  const { rows } = await client.query(`SELECT count(*) FROM "course_category"`);
  console.log(`✅ Success! course_category has ${rows[0].count} categories.`);

  await client.end();
}

main().catch((err) => {
  console.error("❌ Migration error:", err);
  process.exit(1);
});
