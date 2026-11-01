/**
 * Two-process, data-free migration rehearsal on an ephemeral GitHub Actions runner.
 * CLI usage: <seed|upgrade> <sqlite-path> <migrations-directory>.
 *
 * The seed phase uses the previous fork's historical SQL files, while the
 * upgrade phase uses the candidate's SQL files. No production database,
 * customer rows or credentials are ever copied into the runner.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const [mode, sqliteFile, migrationDir] = process.argv.slice(2);
if (!["seed", "upgrade"].includes(mode) || !sqliteFile || !migrationDir) {
  throw new Error("Usage: <seed|upgrade> <sqlite-path> <migration-dir>");
}
process.env.OMNIROUTE_MIGRATIONS_DIR = path.resolve(migrationDir);
const { runMigrations } = await import("../../src/lib/db/migrationRunner.ts");
const db = new Database(path.resolve(sqliteFile));
try {
  if (mode === "seed") {
    const count = runMigrations(db, { isNewDb: true });
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
    const applied = runMigrations(db, { isNewDb: false, databaseExistedBeforeInitialization: true });
    assert.ok(applied > 0, "New upstream migrations must be applied");
    assert.ok(applied < 50, "Unexpectedly large migration delta");
    assert.equal(db.prepare("SELECT preferred_connections AS preferences FROM api_keys WHERE id = ?").get("rehearsal-only")?.preferences, '["synthetic-conn"]');
    assert.equal(db.prepare("SELECT value FROM db_meta WHERE key = 'test-upgrade-marker'").get()?.value, "preserve-me");
    for (const column of ["headers_ms", "first_chunk_ms"]) {
      assert.ok(db.prepare("PRAGMA table_info(proxy_logs)").all().some((c) => c.name === column), `Missing ${column}`);
    }
    assert.equal(db.prepare("SELECT name FROM _omniroute_migrations WHERE version = '213'").get()?.name, "api_key_preferred_connections");
    assert.equal(db.prepare("SELECT name FROM _omniroute_migrations WHERE version = '223'").get()?.name, "proxy_logs_attempt_timing");
    assert.equal(runMigrations(db, { isNewDb: false, databaseExistedBeforeInitialization: true }), 0);
    console.log(`UPGRADE_PASSED before=${before} applied=${applied} total=${db.prepare("SELECT COUNT(*) AS total FROM _omniroute_migrations").get().total}`);
  }
} finally {
  db.close();
}
