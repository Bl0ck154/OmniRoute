import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const core = fs.readFileSync("src/lib/db/core.ts", "utf8");

test("getDbInstance closes a newly opened DB handle when initialization throws", () => {
  const openAt = core.indexOf("const db = openSqliteDatabase(sqliteFile);");
  const nextExport = core.indexOf("export function pingDb", openAt);
  assert.notEqual(openAt, -1);
  assert.notEqual(nextExport, -1);
  const init = core.slice(openAt, nextExport);

  assert.match(init, /const db = openSqliteDatabase\(sqliteFile\);\s*try \{/s);
  assert.match(init, /catch \(error\)/);
  assert.match(init, /if \(getDb\(\) === db\) setDb\(null\)/);
  assert.match(init, /clearDbHealthCheckScheduler\(\)/);
  assert.match(init, /stopWalMaintenance\(\)/);
  assert.match(init, /closeProbeIfSafe\(db\)/);
  assert.match(init, /throw error/);
});
