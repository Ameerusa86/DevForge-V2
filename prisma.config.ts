import { defineConfig } from "prisma/config";
import fs from "fs";
import path from "path";

// Load env files manually to ensure they are available to Prisma CLI config
const loadEnv = (filename: string) => {
  const filePath = path.resolve(process.cwd(), filename);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    content.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const parts = trimmed.split("=");
        const key = parts[0]?.trim();
        let value = parts.slice(1).join("=").trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        if (key) {
          // Allow values from .env.local to take precedence
          if (filename === ".env.local" || !process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  }
};

loadEnv(".env.local");
loadEnv(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use DIRECT_URL for migrations — bypasses pgBouncer (required by Prisma)
    url:
      process.env["DIRECT_URL"] ||
      process.env["SUPABASE_DATABASE_URL"] ||
      process.env["DATABASE_URL"],
  },
});
