import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const core = fs.readFileSync("src/lib/db/core.ts", "utf8");
const route = fs.readFileSync("src/app/api/db/health/route.ts", "utf8");

test("dashboard DB health GET skips integrity scan", () => {
  assert.match(
    route,
    /runManagedDbHealthCheck\(\{ autoRepair: false, skipIntegrityCheck: true \}\)/
  );
});

test("manual DB health repair does not waive integrity scan", () => {
  assert.match(route, /runManagedDbHealthCheck\(\{ autoRepair: true \}\)/);
  assert.doesNotMatch(
    route,
    /runManagedDbHealthCheck\(\{ autoRepair: true, skipIntegrityCheck: true \}\)/
  );
});

test("managed health forwards skipIntegrityCheck into the coordinator", () => {
  const start = core.indexOf("export function runManagedDbHealthCheck");
  const end = core.indexOf("export function getDbInstance", start);
  const body = core.slice(start, end);
  assert.match(body, /skipIntegrityCheck\?: boolean/);
  assert.match(body, /managedHealth\.run\([\s\S]*options\?\.skipIntegrityCheck === true/);
});
