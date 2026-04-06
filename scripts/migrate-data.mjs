/**
 * Data migration script: Neon → Supabase
 * Reads rows from each table in the source (Neon) DB and upserts them into the target (Supabase) DB.
 *
 * Usage:
 *   node scripts/migrate-data.mjs
 *
 * Requires both SOURCE_DATABASE_URL and TARGET_DATABASE_URL to be set in .env.local
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import pg from "pg";

// ---------------------------------------------------------------------------
// Load .env.local manually (no dotenv dependency needed – just string parsing)
// ---------------------------------------------------------------------------
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
    // file not found – ignore
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

// ---------------------------------------------------------------------------
// Connection strings
// ---------------------------------------------------------------------------
const SOURCE_URL =
  process.env.SOURCE_DATABASE_URL ||
  // Fall back to the commented-out Neon URL if SOURCE_DATABASE_URL not set
  "postgresql://neondb_owner:npg_84fUcspuYRqw@ep-rapid-star-a8gf3ox8-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

const TARGET_URL = process.env.TARGET_DATABASE_URL || process.env.DIRECT_URL;

if (!TARGET_URL) {
  console.error("❌  TARGET_DATABASE_URL or DIRECT_URL must be set.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Tables in dependency order (parents before children)
// ---------------------------------------------------------------------------
const TABLES = [
  "user",
  "account",
  "session",
  "verification",
  "course",
  "module",
  "lesson",
  "enrollment",
  "lesson_progress",
  "review",
  "notification",
  "fileUpload",
  // settings / misc tables added by later migrations
  "ContactSettings",
  "StatusPage",
  "PricingPlan",
];

async function migrate() {
  const source = new pg.Client({ connectionString: SOURCE_URL });
  const target = new pg.Client({ connectionString: TARGET_URL });

  console.log("🔌  Connecting to source (Neon)…");
  await source.connect();
  console.log("🔌  Connecting to target (Supabase)…");
  await target.connect();

  for (const table of TABLES) {
    // Check if table exists in source
    const existsRes = await source.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
      [table],
    );
    if (existsRes.rowCount === 0) {
      console.log(`⚪  Skipping "${table}" (not found in source)`);
      continue;
    }

    const { rows } = await source.query(`SELECT * FROM "${table}"`);
    if (rows.length === 0) {
      console.log(`⚪  "${table}" – 0 rows, skipping`);
      continue;
    }

    const cols = Object.keys(rows[0]);
    const colList = cols.map((c) => `"${c}"`).join(", ");
    const conflictCols = `"${cols[0]}"`; // first col is always the PK

    let inserted = 0;
    for (const row of rows) {
      const values = cols.map((c) => row[c]);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
      const updateSet = cols
        .slice(1)
        .map((c, i) => `"${c}" = $${i + 2}`)
        .join(", ");

      const sql =
        cols.length > 1
          ? `INSERT INTO "${table}" (${colList}) VALUES (${placeholders})
             ON CONFLICT (${conflictCols}) DO UPDATE SET ${updateSet}`
          : `INSERT INTO "${table}" (${colList}) VALUES (${placeholders})
             ON CONFLICT (${conflictCols}) DO NOTHING`;

      try {
        await target.query(sql, values);
        inserted++;
      } catch (err) {
        console.warn(`  ⚠️  Row skipped in "${table}":`, err.message);
      }
    }

    console.log(`✅  "${table}" – ${inserted}/${rows.length} rows migrated`);
  }

  await source.end();
  await target.end();
  console.log("\n🎉  Migration complete!");
}

migrate().catch((err) => {
  console.error("❌  Migration failed:", err.message);
  process.exit(1);
});
