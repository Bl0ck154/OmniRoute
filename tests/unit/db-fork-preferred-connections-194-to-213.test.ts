import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

// Real SQLite upgrade regression. No production data is read or modified.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omniroute-fork-migration-"));
const prior = process.env.OMNIROUTE_MIGRATIONS_DIR;
process.env.OMNIROUTE_MIGRATIONS_DIR = dir;
for (const [name, sql] of Object.entries({
  "170_log_export_destinations.sql": "CREATE TABLE IF NOT EXISTS log_export_destinations (id TEXT PRIMARY KEY);",
  "194_proxy_logs_attempt_timing.sql": "ALTER TABLE proxy_logs ADD COLUMN headers_ms INTEGER DEFAULT NULL; ALTER TABLE proxy_logs ADD COLUMN first_chunk_ms INTEGER DEFAULT NULL;",
  "213_api_key_preferred_connections.sql": "ALTER TABLE api_keys ADD COLUMN preferred_connections TEXT;",
})) {
  fs.writeFileSync(path.join(dir, name), sql);
}

const { runMigrations } = await import("../../src/lib/db/migrationRunner.ts");

test.after(() => {
  fs.rmSync(dir, { recursive: true, force: true });
  if (prior === undefined) delete process.env.OMNIROUTE_MIGRATIONS_DIR;
  else process.env.OMNIROUTE_MIGRATIONS_DIR = prior;
});

for (const legacyVersion of ["170", "194"] as const) {
  test("existing custom " + legacyVersion + " ledger migrates to fork 213, applies upstream 194", () => {
    const db = new Database(":memory:");
    try {
      db.exec("CREATE TABLE api_keys (id TEXT PRIMARY KEY, preferred_connections TEXT);" +
              " CREATE TABLE proxy_logs (id TEXT PRIMARY KEY);" +
              " CREATE TABLE _omniroute_migrations (" +
              " version TEXT PRIMARY KEY, name TEXT NOT NULL," +
              " applied_at TEXT NOT NULL DEFAULT (datetime('now')));");
      db.prepare("INSERT INTO _omniroute_migrations (version, name) VALUES (?, ?)").run(
        legacyVersion,
        "api_key_preferred_connections"
      );
      runMigrations(db);
      const rows = db.prepare("SELECT version, name FROM _omniroute_migrations ORDER BY version").all();
      assert.deepEqual(rows, [
        { version: "170", name: "log_export_destinations" },
        { version: "194", name: "proxy_logs_attempt_timing" },
        { version: "213", name: "api_key_preferred_connections" },
      ]);
      const api = db.prepare("PRAGMA table_info(api_keys)").all() as Array<{name:string}>;
      const proxy = db.prepare("PRAGMA table_info(proxy_logs)").all() as Array<{name:string}>;
      assert.equal(api.filter((column) => column.name === "preferred_connections").length, 1);
      assert.ok(proxy.some((column) => column.name === "headers_ms"));
      assert.ok(proxy.some((column) => column.name === "first_chunk_ms"));
    } finally {
      db.close();
    }
  });
}
