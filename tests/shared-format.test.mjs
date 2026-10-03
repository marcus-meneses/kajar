import assert from "node:assert/strict";

const { fallbackLabel, formatCount } =
  await import("../dist-test/shared/utils/format.js");

assert.equal(fallbackLabel("Brasil", "Fallback"), "Brasil");
assert.equal(fallbackLabel("   ", "Fallback"), "Fallback");
assert.equal(fallbackLabel(null, "Fallback"), "Fallback");
assert.equal(formatCount(1234), (1234).toLocaleString());

console.log("shared format utilities ok");
