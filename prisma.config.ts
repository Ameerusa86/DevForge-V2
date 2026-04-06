import { defineConfig } from "prisma/config";

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
