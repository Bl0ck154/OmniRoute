import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (name: string) => fs.readFileSync(path.resolve(process.cwd(),
  "src/app/api/v1/images",name,"route.ts"), "utf8");

test("generations samples inside actual credential fallback attempt", () => {
  const src = read("generations");
  const fallback = src.indexOf("const execution = await executeImageWithCredentialFallback");
  const quota = src.indexOf("withCodexImageQuotaAttempt({", fallback);
  const result = src.indexOf("const result = execution.result", quota);
  const headers = src.indexOf("attachCodexImageQuotaHeaders(", result);
  assert.ok(fallback >= 0 && fallback < quota && quota < result && result < headers);
  assert.match(src, /connectionId: attemptCredentials\?\.connectionId/);
  assert.match(src, /credentials: attemptCredentials/);
});

test("Codex edit headers only emitted after success and never change original JSON payload", () => {
  const src = read("edits");
  const quota = src.indexOf("withCodexImageQuotaAttempt({");
  const success = src.indexOf("if (result.success === true)", quota);
  const headers = src.indexOf("attachCodexImageQuotaHeaders(", success);
  assert.ok(quota > 0 && success > quota && headers > success);
  assert.match(src, /return imageEditSuccessResponse\(result\.data, artifactCapture, quotaHeaders\)/);
});
