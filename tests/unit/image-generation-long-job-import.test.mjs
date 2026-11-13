import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const routeSource = readFileSync(
  new URL("../../src/app/api/v1/images/generations/route.ts", import.meta.url),
  "utf8"
);

test("global images/generations route imports its long-job options helper", () => {
  assert.match(
    routeSource,
    /import\s*\{\s*getImageLongJobOptions\s*\}\s*from\s*["']@\/lib\/images\/imageGenerationLongJobs["']/
  );
  assert.match(routeSource, /longJobs:\s*getImageLongJobOptions\(\)/);
});
