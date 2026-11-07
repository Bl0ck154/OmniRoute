/**
 * Two-process, data-free migration rehearsal on an ephemeral GitHub Actions runner.
 * CLI usage: <seed|upgrade> <sqlite-path> <migrations-directory>.
 *
 * The seed phase uses the previous fork's historical SQL files, while the
 * upgrade phase uses the candidate's SQL files. No production database,
 * customer rows or credentials are ever copied into the runner.
 */
import assert from "node:assert/strict";
import path from "node:path";

const [mode, sqliteFile, migrationDir] = process.argv.slice(2);
if (!["seed", "upgrade"].includes(mode) || !sqliteFile || !migrationDir) {
  throw new Error("Usage: <seed|upgrade> <sqlite-path> <migration-dir>");
}
if (path.basename(sqliteFile) !== "storage.sqlite") {
  throw new Error("The core database initializer owns DATA_DIR/storage.sqlite");
}
process.env.DATA_DIR = path.dirname(path.resolve(sqliteFile));
process.env.OMNIROUTE_MIGRATIONS_DIR = path.resolve(migrationDir);
// The real startup creates tables and heals legacy columns BEFORE invoking
// runMigrations (migration 127 relies on that). Running bare SQL alone is not
// representative of an installed OmniRoute package.
const { getDbInstance } = await import("../../src/lib/db/core.ts");
const db = getDbInstance();
try {
  if (mode === "seed") {
    const count = db.prepare("SELECT COUNT(*) AS total FROM _omniroute_migrations").get().total;
    assert.ok(count > 150, `Expected the historical fork schema, got only ${count} migrations`);
    assert.ok(db.prepare("PRAGMA table_info(api_keys)").all().some((c) => c.name === "preferred_connections"));
    db.prepare("INSERT INTO api_keys (id, name, key, created_at, preferred_connections) VALUES (?, ?, ?, ?, ?)").run(
      "rehearsal-only", "Fixture", "synthetic-not-secret", "2026-01-01", '["synthetic-conn"]'
    );
    db.prepare("INSERT OR REPLACE INTO db_meta (key, value) VALUES (?, ?)").run("test-upgrade-marker", "preserve-me");
    const record = db.prepare("SELECT name FROM _omniroute_migrations WHERE version = '194'").get();
    assert.equal(record?.name, "api_key_preferred_connections");
    console.log(`SEEDED_FROM_FORK_MIGRATIONS=${count}`);
  } else {
    const before = db.prepare("SELECT COUNT(*) AS total FROM _omniroute_migrations").get().total;
    // getDbInstance() already performed the actual upgrade and idempotency
    // checks during initialization. The seed phase inserted a synthetic key.
    assert.ok(before > 150, "Candidate should preserve the existing migration ledger");
    assert.equal(db.prepare("SELECT preferred_connections AS preferences FROM api_keys WHERE id = ?").get("rehearsal-only")?.preferences, '["synthetic-conn"]');
    assert.equal(db.prepare("SELECT value FROM db_meta WHERE key = 'test-upgrade-marker'").get()?.value, "preserve-me");
    for (const column of ["headers_ms", "first_chunk_ms"]) {
      assert.ok(db.prepare("PRAGMA table_info(proxy_logs)").all().some((c) => c.name === column), `Missing ${column}`);
    }
    assert.equal(db.prepare("SELECT name FROM _omniroute_migrations WHERE version = '213'").get()?.name, "api_key_preferred_connections");
    assert.equal(db.prepare("SELECT name FROM _omniroute_migrations WHERE version = '223'").get()?.name, "call_logs_queue_wait_ms");
    assert.equal(db.prepare("SELECT name FROM _omniroute_migrations WHERE version = '224'").get()?.name, "proxy_logs_egress_ip_families");
    assert.equal(db.prepare("SELECT name FROM _omniroute_migrations WHERE version = '900'").get()?.name, "proxy_logs_attempt_timing");
    for (const column of ["egress_ip_v4", "egress_ip_v6"]) {
      assert.ok(db.prepare("PRAGMA table_info(proxy_logs)").all().some((c) => c.name === column), "Missing " + column);
    }
    assert.ok(db.prepare("PRAGMA table_info(call_logs)").all().some((c) => c.name === "queue_wait_ms"));
    console.log(`UPGRADE_PASSED migration_ledger_entries=${before}`);
  }
} finally {
  db.close();
}
