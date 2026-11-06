// Generates the static POC of the proposed Open Government Schemes API
// (docs/api/openapi.yaml) under api/v1/ from data/schemes.json.
// The app reads ONLY through this API, so an official endpoint can replace it.
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const L = require("../src/engine/locations.js");

const OUT = "api/v1";
const data = JSON.parse(readFileSync("data/schemes.json", "utf8"));
const schemes = data.schemes;
const write = (p, obj) => { mkdirSync(p.split("/").slice(0, -1).join("/"), { recursive: true }); writeFileSync(p, JSON.stringify(obj)); };

rmSync(OUT, { recursive: true, force: true });
const coverage = {};
for (const s of schemes) for (const j of s.jurisdictions) coverage[j] = (coverage[j] || 0) + 1;

write(`${OUT}/meta.json`, {
  apiVersion: "1.0.0-poc",
  schemaVersion: data.schemaVersion,
  generatedAt: data.generatedAt,
  count: schemes.length,
  publisher: "Mera Haq POC (not an official Government of India API)",
  notice: "Proof of concept of a proposed official API. Records are traceable to official sources; see each record's sources and evidence.",
  coverage,
});
write(`${OUT}/schemes/index.json`, { count: schemes.length, generatedAt: data.generatedAt, schemes });
for (const s of schemes) write(`${OUT}/schemes/${s.id}.json`, s);
write(`${OUT}/jurisdictions/index.json`, {
  jurisdictions: L.ALL.map((l) => ({ code: l.code, name: l.name, type: l.type, schemeCount: coverage[l.code] || 0 })),
});
for (const l of L.ALL) {
  const list = schemes.filter((s) => s.jurisdictions.includes("ALL") || s.jurisdictions.includes(l.code));
  write(`${OUT}/jurisdictions/${l.code}/schemes.json`, { count: list.length, generatedAt: data.generatedAt, schemes: list });
}
const changes = readdirSync("data/history").filter((f) => f.endsWith(".json")).sort().reverse()
  .map((f) => JSON.parse(readFileSync(`data/history/${f}`, "utf8")));
write(`${OUT}/changes/index.json`, { changes });
copyFileSync("docs/api/openapi.yaml", `${OUT}/openapi.yaml`);
console.log(`api/v1: ${schemes.length} schemes, ${L.ALL.length} jurisdictions, ${changes.length} change events`);
