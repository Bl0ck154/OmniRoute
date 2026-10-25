import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(
  process.cwd(),
  "src/app/(dashboard)/dashboard/settings/components/ResilienceTab.tsx"
), "utf8");
test("existing ResilienceTab maps Antigravity response into one saveable card", () => {
  assert.match(source, /antigravity:\s*json\.antigravity/);
  assert.match(source, /<AntigravityResilienceCard/);
  assert.match(source, /saving=\{savingSection === "antigravity"\}/);
  assert.match(source, /savePatch\("antigravity", \{ antigravity \}\)/);
  assert.equal((source.match(/<AntigravityResilienceCard/g) ?? []).length, 1);
});
