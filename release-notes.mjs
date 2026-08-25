#!/usr/bin/env node
// Skriver CHANGELOG-afsnittet for den aktuelle package.json-version til stdout.
// Bruges af .github/workflows/release.yml som release-noter; kan koeres lokalt:
//   node release-notes.mjs
import { readFileSync } from "node:fs";

const V = JSON.parse(readFileSync("package.json", "utf8")).version;
const lines = readFileSync("CHANGELOG.md", "utf8").split(/\r?\n/);

const start = lines.findIndex((l) => l.startsWith(`## [${V}]`));
if (start < 0) {
  console.error(`CHANGELOG.md: mangler afsnittet "## [${V}]"`);
  process.exit(1);
}
let end = lines.findIndex((l, i) => i > start && l.startsWith("## ["));
if (end < 0) end = lines.length;

const body = lines.slice(start + 1, end).join("\n").trim();
if (!body) {
  console.error(`CHANGELOG.md: afsnittet "## [${V}]" er tomt`);
  process.exit(1);
}
process.stdout.write(body + "\n");
