import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_CODEX_IMAGE_EDIT_REFERENCES,
  MAX_CODEX_GPT_IMAGE_EDIT_REFERENCES,
} from "../../src/lib/images/imageRouteModel.ts";

test("legacy Codex hosted Responses image editing retains the verified eight-image limit", () => {
  assert.equal(MAX_CODEX_IMAGE_EDIT_REFERENCES, 8);
});

test("dedicated GPT Image edits keep their independent 16-image limit", () => {
  assert.equal(MAX_CODEX_GPT_IMAGE_EDIT_REFERENCES, 16);
});
