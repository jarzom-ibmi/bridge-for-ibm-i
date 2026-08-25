#!/usr/bin/env node
// Dokumentationsrevision for Bridge for i - fanger den drift, der tidligere
// slap lydløst igennem: forældede versionsnumre, gamle indstillings-ID'er og
// forkerte .vsix-navne. Koeres foer hver pakning:  node check-docs.mjs
import { readFileSync, existsSync } from "node:fs";
const V = JSON.parse(readFileSync("package.json", "utf8")).version;
const NLS_EN = JSON.parse(readFileSync("package.nls.json", "utf8"));
const NLS_DA = JSON.parse(readFileSync("package.nls.da.json", "utf8"));
const NAME = NLS_EN["ext.displayName"];
const errs = [];
const must = (cond, msg) => { if (!cond) errs.push(msg); };

// README.md er baade Details-fanen paa extension-siden og den komplette
// vejledning ("Open manual" aabner den). MANUAL.md er udgaaet.
must(!existsSync("MANUAL.md"), "MANUAL.md: skal vaere vaek - README.md er nu vejledningen");
for (const f of ["README.md"]) {
  const s = readFileSync(f, "utf8");
  must(!/claudeMemberBridge\./.test(s), `${f}: gamle indstillings-ID'er (claudeMemberBridge.*)`);
  must(!/claude-member-bridge-[\d.]+\.vsix/.test(s), `${f}: gammelt .vsix-navn`);
  const vsix = [...s.matchAll(/bridge-for-i-([\d.]+)\.vsix/g)].map(m => m[1]);
  must(vsix.length > 0 && vsix.every(v => v === V), `${f}: .vsix-navn matcher ikke version ${V} (fandt: ${[...new Set(vsix)] || "ingen"})`);
  const logs = [...s.matchAll(/Bridge for IBM i v([\d.]+) (?:active|aktiv)/g)].map(m => m[1]);
  must(logs.length > 0 && logs.every(v => v === V), `${f}: loglinje-eksemplet mangler eller siger ikke v${V}`);
  must(/AGENTS\.md/.test(s), `${f}: naevner ikke AGENTS.md - agent-neutral rammesaetning mangler`);
  must(!/Claude Code (?:works on ordinary files|cannot see them|arbejder paa almindelige|ikke se)/.test(s), `${f}: Claude-centrisk problemformulering er vendt tilbage`);
  must(!/\((?:for|til) Claude\)/.test(s), `${f}: citerer forældede kommandotitler "(for/til Claude)" - de faktiske hedder "(for/til AI)"`);
  must(!/binde spejlet om|spejlet er bundet/.test(s), `${f}: gammel bindings-terminologi - brug "knytte/knyttet til"`);
  must(!/Source [Aa]vailable|separat licens|separate license/.test(s), `${f}: indeholder stadig Source Available-formuleringer`);
}
const readme = readFileSync("README.md", "utf8");
const heads = [...readme.matchAll(/\*\*Version ([\d.]+) ·/g)].map(m => m[1]);
must(heads.length === 2 && heads.every(v => v === V), `README.md: version i overskrifterne er ${heads} - skal være ${V} begge steder`);
must(readme.includes(`# ${NAME}`), `README.md: overskriften matcher ikke visningsnavnet "${NAME}"`);
for (const key of ["cmd.pullNode","cmd.pull","cmd.openManual"])
  for (const [lang, nls] of [["EN", NLS_EN], ["DA", NLS_DA]])
    must(readme.includes(nls[key]), `README.md: mangler den faktiske ${lang}-titel "${nls[key]}" - dokumentet citerer ikke UI'en korrekt`);
const lic = readFileSync("LICENSE", "utf8");
must(lic.includes("MIT License") && lic.includes("Glenn Jarzomkowski") && lic.includes("jarzom@gmail.com"), "LICENSE: skal vaere MIT med ophavsret og kontakt-email");
must(!/Source Available/i.test(lic), "LICENSE: indeholder stadig Source Available-tekst");
must(JSON.parse(readFileSync("package.json","utf8")).license === "MIT", "package.json: license-feltet skal vaere MIT");
must(!/licen[sc]e|licens|\bMIT\b/i.test(readFileSync("CHANGELOG.md","utf8")), "CHANGELOG.md: skal vaere fri for licens-omtale");
const cl = readFileSync("CHANGELOG.md", "utf8");
must(cl.includes(`## [${V}]`), `CHANGELOG.md: mangler post for [${V}]`);

if (errs.length) { console.error("DOKUMENT-DRIFT FUNDET:"); errs.forEach(e => console.error("  ✗ " + e)); process.exit(1); }
console.log(`✓ dokumentation konsistent med version ${V}`);
