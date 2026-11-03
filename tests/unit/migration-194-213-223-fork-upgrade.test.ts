/**
 * Compatibility rehearsal for the old patched fork's migration 194.
 *
 * Legacy production already has api_keys.preferred_connections from 194,
 * while upstream reintroduces that column at 213 and records queue wait at
 * 223; the old fork proxy timing at 223/224 is now 900. This fixture uses schema-only, synthetic rows:
 * no actual production data or database files.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const source = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../src/lib/db/migrations");
const migrationsDir = fs.mkdtempSync(path.join(os.tmpdir(), "omniroute-fork-194-"));
for (const file of [
  "194_api_key_preferred_connections.sql",
  "213_api_key_preferred_connections.sql",
  "223_call_logs_queue_wait_ms.sql",
  "224_proxy_logs_egress_ip_families.sql",
  "900_proxy_logs_attempt_timing.sql",
]) fs.copyFileSync(path.join(source, file), path.join(migrationsDir, file));

const savedDir = process.env.OMNIROUTE_MIGRATIONS_DIR;
process.env.OMNIROUTE_MIGRATIONS_DIR = migrationsDir;
const { runMigrations } = await import("../../src/lib/db/migrationRunner.ts");

test.after(() => {
  fs.rmSync(migrationsDir, { recursive: true, force: true });
  if (savedDir === undefined) delete process.env.OMNIROUTE_MIGRATIONS_DIR;
  else process.env.OMNIROUTE_MIGRATIONS_DIR = savedDir;
});

test("legacy custom.43 timing migration at 223 is rehomed before official 223/224 run", () => {
  const db = new Database(":memory:");
  try {
    db.exec("CREATE TABLE api_keys (id TEXT PRIMARY KEY, preferred_connections TEXT)");
    db.exec("CREATE TABLE proxy_logs (id TEXT PRIMARY KEY, headers_ms INTEGER, first_chunk_ms INTEGER)");
    db.exec("CREATE TABLE call_logs (id TEXT PRIMARY KEY)");
    db.exec("CREATE TABLE _omniroute_migrations (version TEXT PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");
    db.prepare("INSERT INTO api_keys (id, preferred_connections) VALUES (?, ?)").run("fixture-key", JSON.stringify(["conn-a"]));
    db.prepare("INSERT INTO proxy_logs (id, headers_ms, first_chunk_ms) VALUES (?, ?, ?)").run("proxy", 12, 21);
    for (const [version, name] of [["194", "api_key_preferred_connections"], ["213", "api_key_preferred_connections"], ["223", "proxy_logs_attempt_timing"]]) {
      db.prepare("INSERT INTO _omniroute_migrations (version, name) VALUES (?, ?)").run(version, name);
    }
    assert.equal(runMigrations(db, { isNewDb: true }), 2);
    const ledger = db.prepare("SELECT version, name FROM _omniroute_migrations ORDER BY version").all();
    assert.deepEqual(ledger, [
      { version: "194", name: "api_key_preferred_connections" },
      { version: "213", name: "api_key_preferred_connections" },
      { version: "223", name: "call_logs_queue_wait_ms" },
      { version: "224", name: "proxy_logs_egress_ip_families" },
      { version: "900", name: "proxy_logs_attempt_timing" },
    ]);
    assert.deepEqual(db.prepare("SELECT headers_ms, first_chunk_ms FROM proxy_logs WHERE id = ?").get("proxy"), { headers_ms: 12, first_chunk_ms: 21 });
    assert.ok((db.prepare("PRAGMA table_info(call_logs)").all() as Array<{ name: string }>).some(c => c.name === "queue_wait_ms"));
    assert.equal(runMigrations(db, { isNewDb: true }), 0);
  } finally { db.close(); }
});

for (const previousTiming of [[], ["headers_ms"], ["first_chunk_ms"], ["headers_ms", "first_chunk_ms"]]) {
  test(`fork 194 + upstream 213/223/224 and fork 900 migrates without repeating preferred_connections (timing: ${previousTiming.join(",") || "none"})`, () => {
    const db = new Database(":memory:");
    try {
      db.exec(`
        CREATE TABLE api_keys (id TEXT PRIMARY KEY, preferred_connections TEXT);
        CREATE TABLE proxy_logs (id TEXT PRIMARY KEY);
        CREATE TABLE call_logs (id TEXT PRIMARY KEY);
        CREATE TABLE _omniroute_migrations (
          version TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        INSERT INTO api_keys (id, preferred_connections) VALUES ('fixture-key', '["conn-a","conn-b"]');
        INSERT INTO proxy_logs (id) VALUES ('fixture-proxy');
        INSERT INTO _omniroute_migrations (version, name) VALUES ('194', 'api_key_preferred_connections');
      `);
      for (const name of previousTiming) {
        db.exec(`ALTER TABLE proxy_logs ADD COLUMN ${name} INTEGER DEFAULT NULL`);
      }

      // isNewDb disables mass migration guard for this schema-only synthetic fixture;
      // it does not imply anything about the actual production database.
      assert.equal(runMigrations(db, { isNewDb: true }), 4);
      const versions = db.prepare("SELECT version, name FROM _omniroute_migrations ORDER BY version").all();
      assert.deepEqual(versions, [
        { version: "194", name: "api_key_preferred_connections" },
        { version: "213", name: "api_key_preferred_connections" },
        { version: "223", name: "call_logs_queue_wait_ms" },
        { version: "224", name: "proxy_logs_egress_ip_families" },
        { version: "900", name: "proxy_logs_attempt_timing" },
      ]);
      const callLogCols = (db.prepare("PRAGMA table_info(call_logs)").all() as Array<{ name: string }>).map(c => c.name);
      assert.equal(callLogCols.filter(c => c === "queue_wait_ms").length, 1);
      const originalKey = db.prepare("SELECT preferred_connections AS p FROM api_keys WHERE id='fixture-key'").get() as { p: string } | undefined;
      assert.equal(originalKey?.p, '["conn-a","conn-b"]');
      const cols = (db.prepare("PRAGMA table_info(proxy_logs)").all() as Array<{ name: string }>).map(c => c.name);
      assert.equal(cols.filter(c => c === "headers_ms").length, 1);
      assert.equal(cols.filter(c => c === "first_chunk_ms").length, 1);
      assert.equal(runMigrations(db, { isNewDb: true }), 0, "subsequent startups must be idempotent");
    } finally {
      db.close();
    }
  });
}


test("fork installs with already-applied timing version 224 rehome to 900", () => {
  const db = new Database(":memory:");
  try {
    db.exec([
      "CREATE TABLE api_keys (id TEXT PRIMARY KEY, preferred_connections TEXT)",
      "CREATE TABLE call_logs (id TEXT PRIMARY KEY, queue_wait_ms INTEGER)",
      "CREATE TABLE proxy_logs (id TEXT PRIMARY KEY, headers_ms INTEGER, first_chunk_ms INTEGER)",
      "CREATE TABLE _omniroute_migrations (version TEXT PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
      "INSERT INTO _omniroute_migrations (version,name) VALUES ('194','api_key_preferred_connections')",
      "INSERT INTO _omniroute_migrations (version,name) VALUES ('213','api_key_preferred_connections')",
      "INSERT INTO _omniroute_migrations (version,name) VALUES ('223','call_logs_queue_wait_ms')",
      "INSERT INTO _omniroute_migrations (version,name) VALUES ('224','proxy_logs_attempt_timing')",
      "INSERT INTO proxy_logs (id,headers_ms,first_chunk_ms) VALUES ('already-timed',15,28)"
    ].join(";") + ";");

    assert.equal(runMigrations(db, { isNewDb: true }), 1);
    assert.deepEqual(
      db.prepare("SELECT version,name FROM _omniroute_migrations ORDER BY version").all(),
      [
        { version: "194", name: "api_key_preferred_connections" },
        { version: "213", name: "api_key_preferred_connections" },
        { version: "223", name: "call_logs_queue_wait_ms" },
        { version: "224", name: "proxy_logs_egress_ip_families" },
        { version: "900", name: "proxy_logs_attempt_timing" },
      ]
    );
    const proxyCols = (db.prepare("PRAGMA table_info(proxy_logs)").all() as Array<{name:string}>).map(c => c.name);
    assert.ok(proxyCols.includes("egress_ip_v4"));
    assert.ok(proxyCols.includes("egress_ip_v6"));
    assert.deepEqual(
      db.prepare("SELECT headers_ms,first_chunk_ms FROM proxy_logs WHERE id='already-timed'").get(),
      {headers_ms:15,first_chunk_ms:28}
    );
    assert.equal(runMigrations(db, { isNewDb: true }), 0);
  } finally {
    db.close();
  }
});
