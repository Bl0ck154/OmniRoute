import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import Database from "better-sqlite3";

// Intentionally fake only the three relevant migration slots. This exercises
// the actual runner/ledger reconciliation without touching an operator DB.
const migrationDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniroute-pref-bridge-"));
const previousDir = process.env.OMNIROUTE_MIGRATIONS_DIR;
process.env.OMNIROUTE_MIGRATIONS_DIR = migrationDir;
fs.writeFileSync(
  path.join(migrationDir, "170_log_export_destinations.sql"),
  "CREATE TABLE IF NOT EXISTS official_170_marker (id INTEGER PRIMARY KEY);"
);
fs.writeFileSync(
  path.join(migrationDir, "194_proxy_logs_attempt_timing.sql"),
  "ALTER TABLE proxy_logs ADD COLUMN headers_ms INTEGER DEFAULT NULL;\n" +
    "ALTER TABLE proxy_logs ADD COLUMN first_chunk_ms INTEGER DEFAULT NULL;"
);
fs.writeFileSync(
  path.join(migrationDir, "213_api_key_preferred_connections.sql"),
  "ALTER TABLE api_keys ADD COLUMN preferred_connections TEXT;"
);
const { runMigrations } = await import("../../src/lib/db/migrationRunner.ts");

test.after(() => {
  fs.rmSync(migrationDir, { recursive: true, force: true });
  if (previousDir === undefined) delete process.env.OMNIROUTE_MIGRATIONS_DIR;
  else process.env.OMNIROUTE_MIGRATIONS_DIR = previousDir;
});

type LedgerRow = { version: string; name: string };
function createDb(legacyVersion: "170" | "194" | "none" | "new"): Database.Database {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE api_keys (id TEXT PRIMARY KEY);
    CREATE TABLE proxy_logs (id TEXT PRIMARY KEY);
    CREATE TABLE _omniroute_migrations (
      version TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  if (legacyVersion === "170" || legacyVersion === "194") {
    db.exec("ALTER TABLE api_keys ADD COLUMN preferred_connections TEXT;");
    db.prepare("INSERT INTO _omniroute_migrations (version,name) VALUES (?,?)")
      .run(legacyVersion, "api_key_preferred_connections");
  }
  if (legacyVersion === "new") {
    db.exec("ALTER TABLE api_keys ADD COLUMN preferred_connections TEXT;");
    db.exec("ALTER TABLE proxy_logs ADD COLUMN headers_ms INTEGER;");
    db.exec("ALTER TABLE proxy_logs ADD COLUMN first_chunk_ms INTEGER;");
    const ins = db.prepare("INSERT INTO _omniroute_migrations (version,name) VALUES (?,?)");
    ins.run("170", "log_export_destinations");
    ins.run("194", "proxy_logs_attempt_timing");
    ins.run("213", "api_key_preferred_connections");
  }
  return db;
}

function columns(db: Database.Database, table: string): string[] {
  return (db.pragma(`table_info(${table})`) as Array<{ name: string }>).map((x) => x.name);
}
function ledger(db: Database.Database): LedgerRow[] {
  return db.prepare(
    "SELECT version,name FROM _omniroute_migrations WHERE version IN ('170','194','213') ORDER BY CAST(version AS INTEGER)"
  ).all() as LedgerRow[];
}
for (const legacyVersion of ["170", "194", "none", "new"] as const) {
  test(`bridge accepts ${legacyVersion} ledger and stays idempotent`, () => {
    const db = createDb(legacyVersion);
    try {
      runMigrations(db);
      assert.deepEqual(ledger(db), [
        { version: "170", name: "log_export_destinations" },
        { version: "194", name: "proxy_logs_attempt_timing" },
        { version: "213", name: "api_key_preferred_connections" },
      ]);
      assert.ok(columns(db, "api_keys").includes("preferred_connections"));
      assert.ok(columns(db, "proxy_logs").includes("headers_ms"));
      assert.ok(columns(db, "proxy_logs").includes("first_chunk_ms"));
      assert.equal(runMigrations(db), 0, "repeat boot must not rerun ALTER TABLE");
    } finally {
      db.close();
    }
  });
}
