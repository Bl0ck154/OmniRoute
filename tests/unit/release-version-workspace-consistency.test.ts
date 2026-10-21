import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const jsonAt = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

test("release package version matches the engine workspace and npm lock metadata", () => {
  const pkg = jsonAt("../../package.json");
  const engine = jsonAt("../../open-sse/package.json");
  const lock = jsonAt("../../package-lock.json");
  assert.equal(pkg.version, engine.version);
  assert.equal(pkg.version, lock.version);
  assert.equal(pkg.version, lock.packages[""].version);
  assert.equal(engine.version, lock.packages["open-sse"].version);
});
