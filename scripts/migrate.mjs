/**
 * Migration script — runs before Next.js build on Vercel.
 * Uses the direct (non-pooled) Postgres URL for schema changes.
 * Falls back to DATABASE_URL if the direct URL isn't set.
 */
import { execSync } from "child_process";

const directUrl =
  process.env.notes_db_PRISMA_DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!directUrl) {
  console.error("No database URL found. Skipping migration.");
  process.exit(0);
}

console.log("Running prisma db push...");
try {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: directUrl },
  });
  console.log("prisma db push completed successfully.");
} catch (err) {
  console.error("prisma db push failed:", err.message);
  process.exit(1);
}
