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
    // ignore missing env file
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

const connectionString =
  process.env.DIRECT_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.DATABASE_URL;

if (!connectionString) {
  console.error("No database connection string found.");
  process.exit(1);
}

const client = new pg.Client({ connectionString });

async function main() {
  console.log("Connecting to PostgreSQL database...");
  await client.connect();

  const sqlPath = resolve(
    process.cwd(),
    "prisma/migrations/20261120100000_separate_project_tutorials/migration.sql",
  );
  const sql = readFileSync(sqlPath, "utf8");

  console.log("Applying separate_project_tutorials migration...");
  await client.query(sql);

  const { rows: courseCounts } = await client.query(`
    SELECT "contentType", count(*)::int AS count
    FROM "course"
    GROUP BY "contentType"
  `);
  const { rows: categoryCounts } = await client.query(`
    SELECT "scope", count(*)::int AS count
    FROM "course_category"
    GROUP BY "scope"
  `);

  console.log("Migration applied successfully.");
  console.log("Courses by contentType:", courseCounts);
  console.log("Categories by scope:", categoryCounts);

  await client.end();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
