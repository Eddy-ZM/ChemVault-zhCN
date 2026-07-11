import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const schema = JSON.parse(fs.readFileSync("contracts/public-record-index-v1.schema.json", "utf8"));
const payload = JSON.parse(fs.readFileSync("data/public-record-index.json", "utf8"));

const isNonEmptyString = (value) => typeof value === "string" && value.length > 0;

test("public record index follows the shared v1 contract", () => {
  assert.equal(schema.$id, "https://chemvault.science/contracts/public-record-index-v1.schema.json");
  assert.equal(payload.kind, schema.properties.kind.const);
  assert(isNonEmptyString(payload.version));
  assert(!Number.isNaN(Date.parse(payload.generatedAt)));
  assert.equal(payload.counts.totalRecords, payload.records.length);

  const keys = new Set();
  for (const record of payload.records) {
    for (const field of schema.$defs.record.required) {
      assert(Object.hasOwn(record, field), `${record.type}:${record.id} is missing ${field}`);
    }
    assert(isNonEmptyString(record.id));
    assert(isNonEmptyString(record.type));
    assert(isNonEmptyString(record.typeLabel));
    assert(isNonEmptyString(record.title));
    assert(Array.isArray(record.tags));
    assert(Array.isArray(record.sections));
    assert(record.url.startsWith("https://"));
    assert(isNonEmptyString(record.searchText));

    const key = `${record.type}:${record.id}`;
    assert(!keys.has(key), `duplicate public record key: ${key}`);
    keys.add(key);
  }
});
