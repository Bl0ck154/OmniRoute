import test from "node:test";
import assert from "node:assert/strict";
import { retryLockedDbWrite } from "../../src/lib/usage/deferredLockedDbWrite.ts";

test("locked-call-log retry executes once and resolves before detail publication", async () => {
  let writes = 0;
  let failures = 0;
  await retryLockedDbWrite(() => { writes++; }, () => { failures++; }, { delayMs: 0 });
  assert.equal(writes, 1);
  assert.equal(failures, 0);
});

test("second failure is reported once and the promise still settles", async () => {
  const error = new Error("SQLITE_BUSY");
  const failures: unknown[] = [];
  await retryLockedDbWrite(() => { throw error; }, (err) => { failures.push(err); }, { delayMs: 0 });
  assert.deepEqual(failures, [error]);
});
