import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const schema = await readFile(new URL("../contracts/public-record-index-v1.schema.json", import.meta.url));
const lock = JSON.parse(await readFile(new URL("../contracts/public-record-index-v1.lock.json", import.meta.url), "utf8"));
const digest = createHash("sha256").update(schema).digest("hex");
if (digest !== lock.sha256) {
  throw new Error(`Public record contract drifted: expected ${lock.sha256}, received ${digest}.`);
}
console.log(JSON.stringify({ contract: lock.contract, authority: lock.authority, sha256: digest }));
