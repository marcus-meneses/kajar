import assert from "node:assert/strict";

const text = await import("../dist-test/shared/utils/text.js");
const pagination = await import("../dist-test/shared/utils/pagination.js");
const sort = await import("../dist-test/shared/utils/sort.js");
const tree =
  await import("../dist-test/fiscalCategories/hooks/useFiscalCategoryTree.js");
const permissions =
  await import("../dist-test/permissions/hooks/permissionLogic.js");

assert.equal(text.cleanText("  abc  "), "abc");
assert.equal(text.cleanText("   "), null);
assert.equal(text.requiredText(null), "");
assert.equal(text.label("  Name  ", "Fallback"), "Name");
assert.equal(text.label("", "Fallback"), "Fallback");

let calls = 0;
const pages = await pagination.fetchAllPages(async ({ offset }) => {
  calls += 1;
  return { data: offset === 0 ? [1, 2] : [3] };
}, 2);
assert.deepEqual(pages, [1, 2, 3]);
assert.equal(calls, 2);

assert.deepEqual(
  sort.sortByCode([{ code: "2" }, { code: "1" }]).map((item) => item.code),
  ["1", "2"],
);
assert.deepEqual(
  sort
    .sortByNumericId([{ numericId: "10" }, { numericId: "2" }])
    .map((item) => item.numericId),
  ["2", "10"],
);

const treeRows = tree.buildFiscalCategoryTreeRows(
  [
    { id: "root", parent: null, code: "01", description: "Root" },
    { id: "child", parent: "root", code: "01.1", description: "Child" },
  ],
  "",
  ["root"],
);
assert.deepEqual(
  treeRows.map((row) => [row.id, row.depth]),
  [
    ["root", 0],
    ["child", 1],
  ],
);

const normalized = permissions.normalizeDraft({
  method: "GET",
  path: " api/test ",
  operation: " read ",
  permission: " Description ",
  section: " Section ",
  allowedEmployeeTypes: ["SUP", "SUP"],
  active: true,
});
assert.equal(normalized.path, "/api/test");
assert.deepEqual(normalized.allowedEmployeeTypes, ["SUP"]);
assert.equal(normalized.permission, "Description");

console.log("logic utilities ok");
