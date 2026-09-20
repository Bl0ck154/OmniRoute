import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "health-shutdown-"));
process.env.DATA_DIR = dir;
process.env.OMNIROUTE_SKIP_DB_HEALTHCHECK = "1";
const core = await import("../../src/lib/db/core.ts");

test("shutdownDbInstance cancels pending health work before closing SQLite", async () => {
  const db = core.getDbInstance();
  db.exec("UPDATE db_meta SET value='0' WHERE key='schema_version'; BEGIN IMMEDIATE");

  let settled = false;
  const health = core.runManagedDbHealthCheck({ autoRepair: true }).then(
    () => {
      settled = true;
    },
    () => {
      settled = true;
    }
  );

  try {
    assert.throws(() => core.resetDbInstance(), /already in progress/);
    const closed = await core.shutdownDbInstance();
    assert.equal(closed, true);
    assert.equal(settled, true, "health operation must settle before shutdown returns");
    assert.equal(db.open, false, "serving database must be closed");
    await assert.rejects(core.runManagedDbHealthCheck(), /stopping/);
  } finally {
    if (db.open && db.inTransaction) db.exec("ROLLBACK");
    await health;
    if (db.open) core.closeDbInstance();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("graceful shutdown cleanup awaits shutdownDbInstance", () => {
  const source = fs.readFileSync("src/lib/gracefulShutdown.ts", "utf8");
  assert.match(source, /\{ shutdownDbInstance \}/);
  assert.match(source, /await shutdownDbInstance\(\)/);
});
