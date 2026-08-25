#!/usr/bin/env node
// Release for Bridge for IBM i - EN kommando fra bump til GitHub Release:
//
//   node release.mjs patch|minor|major|X.Y.Z [--dry-run] [--no-push] [--no-install]
//   npm run release -- patch
//
// Raekkefoelge (stopper ved foerste fejl; intet aendres foer "Bump"):
//   1. Preflight: main, rent arbejdstrae, main == origin/main, tag findes ikke.
//   2. CHANGELOG: "## [Unreleased]" med indhold -> "## [NY] - dato" (eller "## [NY]" findes).
//   3. Bump: package.json, README.md, extension.js.   4. node check-docs.mjs (fejl -> rul tilbage).
//   5. vsce package + udskift tracket .vsix.           6. commit "Release NY" + tag vNY.
//   7. push main + tag -> .github/workflows/release.yml bygger releasen.
//   8. Foelg Actions-koerslen til den er faerdig.       9. Installer .vsix'en lokalt.
//
// Release-committen maa KUN indeholde bump'et - derfor kraeves et rent arbejdstrae.
// Alt foer push kan rulles tilbage (reset til origin/main); efter push gives praecis vejledning.
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { execFileSync, execSync } from "node:child_process";

const USAGE = `Brug: node release.mjs <patch|minor|major|X.Y.Z> [--dry-run] [--no-push] [--no-install]

  patch|minor|major  bump ud fra package.json (fx 0.9.2 -> 0.9.3 | 0.10.0 | 1.0.0)
  X.Y.Z (eller vX.Y.Z)  eksplicit ny version
  --dry-run          vis hvad der ville ske - intet aendres
  --no-push          stop efter lokal commit + tag (push selv senere)
  --no-install       spring "code --install-extension" over
  --help, -h         denne tekst

Foer du koerer: skriv noterne under "## [Unreleased]" i CHANGELOG.md, commit og push.`;

// ----------------------------------------------------------------- hjaelpere
function fail(msg) { console.error("✗ " + msg); process.exit(1); }
function step(msg) { console.log("• " + msg); }
function errText(e) {
  const s = e && e.stderr ? String(e.stderr).trim() : "";
  return s || (e && e.message) || String(e);
}
function git(...a) {
  return execFileSync("git", a, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function sh(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
}
// Koer fn; ved fejl kaldes onError med git/shell-fejlteksten (onError afslutter).
function attempt(fn, onError) {
  try { return fn(); } catch (e) { onError(errText(e)); }
}

// ---------------------------------------------------------------- argumenter
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) { console.log(USAGE); process.exit(0); }
const flags = new Set(args.filter((a) => a.startsWith("-")));
for (const f of flags) if (!["--dry-run", "--no-push", "--no-install"].includes(f)) fail(`Ukendt flag ${f}\n\n${USAGE}`);
const DRY = flags.has("--dry-run");
const NO_PUSH = flags.has("--no-push");
const NO_INSTALL = flags.has("--no-install");
const spec = args.find((a) => !a.startsWith("-"));
if (!spec) fail(USAGE);

// ------------------------------------------------------------------ version
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const OLD = pkg.version;
function parse(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) fail(`Ugyldig version "${v}" - brug X.Y.Z`);
  return m.slice(1).map(Number);
}
const [ma, mi, pa] = parse(OLD);
const NEW =
  spec === "patch" ? `${ma}.${mi}.${pa + 1}` :
  spec === "minor" ? `${ma}.${mi + 1}.0` :
  spec === "major" ? `${ma + 1}.0.0` : spec.replace(/^v/, "");
const a = parse(NEW), b = parse(OLD);
const newer = a[0] !== b[0] ? a[0] > b[0] : a[1] !== b[1] ? a[1] > b[1] : a[2] > b[2];
if (!newer) fail(`Ny version ${NEW} er ikke stoerre end den nuvaerende ${OLD}`);
const TAG = `v${NEW}`;
const VSIX_OLD = `bridge-for-i-${OLD}.vsix`;
const VSIX_NEW = `bridge-for-i-${NEW}.vsix`;

const repoMatch = /github\.com[/:]([^/]+)\/([^/.]+)/.exec(String(pkg.repository && pkg.repository.url || ""));
if (!repoMatch) fail("package.json: repository.url peger ikke paa github.com");
const [, OWNER, REPO] = repoMatch;
const RELEASE_URL = `https://github.com/${OWNER}/${REPO}/releases/tag/${TAG}`;
const PUSH_HINT = `  git push origin main\n  git push origin ${TAG}`;

// ---------------------------------------------------------------- preflight
step(`Preflight: ${OLD} → ${NEW} (${TAG})`);
const branch = attempt(() => git("rev-parse", "--abbrev-ref", "HEAD"), (m) => fail(`Ikke et git-repo? ${m}`));
if (branch !== "main") fail(`Du staar paa "${branch}" - releases laves fra main`);
if (git("status", "--porcelain"))
  fail("Arbejdstraeet er ikke rent. Commit eller stash dit arbejde foerst - release-committen maa kun indeholde version-bump'et.");
attempt(() => git("fetch", "origin", "--tags"), (m) => fail(`git fetch fejlede (net/VPN?): ${m}`));
if (git("rev-parse", "main") !== git("rev-parse", "origin/main"))
  fail("Lokal main og origin/main er forskellige - pull eller push foerst");
if (git("tag", "-l", TAG)) fail(`Tag ${TAG} findes allerede lokalt`);
if (git("ls-remote", "--tags", "origin", `refs/tags/${TAG}`)) fail(`Tag ${TAG} findes allerede paa origin`);

// ---------------------------------------------------------------- CHANGELOG
const clLines = readFileSync("CHANGELOG.md", "utf8").split(/\r?\n/);
const today = (() => {
  const d = new Date(), p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
})();
const sectionBody = (startIdx) => {
  let end = clLines.findIndex((l, i) => i > startIdx && l.startsWith("## ["));
  if (end < 0) end = clLines.length;
  return clLines.slice(startIdx + 1, end).join("\n").trim();
};
const iNew = clLines.findIndex((l) => l.startsWith(`## [${NEW}]`));
const iUnrel = clLines.findIndex((l) => /^## \[Unreleased\]/.test(l));
let notes;
if (iNew >= 0) {
  notes = sectionBody(iNew);
  if (!notes) fail(`CHANGELOG.md: "## [${NEW}]" er tomt`);
} else if (iUnrel >= 0 && sectionBody(iUnrel)) {
  notes = sectionBody(iUnrel);
  clLines[iUnrel] = `## [${NEW}] - ${today}`;
} else {
  fail(`CHANGELOG.md: skriv release-noterne under "## [Unreleased]" (eller "## [${NEW}]") foerst`);
}

// --------------------------------------------------------------------- bump
// Praecis de moenstre check-docs.mjs overvaager - ikke "alle forekomster af tallet".
const edits = [];
function planReplace(file, pairs) {
  let s = readFileSync(file, "utf8");
  const counts = [];
  for (const [from, to] of pairs) {
    const n = s.split(from).length - 1;
    if (n < 1) fail(`${file}: fandt ikke "${from}" - dokumentationen er drevet; ret den foerst`);
    s = s.split(from).join(to);
    counts.push(`${n} × "${from}"`);
  }
  edits.push({ file, content: s, summary: counts.join(", ") });
}
planReplace("package.json", [[`"version": "${OLD}"`, `"version": "${NEW}"`]]);
planReplace("README.md", [
  [`bridge-for-i-${OLD}.vsix`, `bridge-for-i-${NEW}.vsix`],     // install-kommandoer, download
  [`Bridge for IBM i v${OLD} `, `Bridge for IBM i v${NEW} `],   // loglinje-eksempler (active/aktiv)
  [`**Version ${OLD} ·`, `**Version ${NEW} ·`],                 // versionsoverskrifter EN/DA
  [`v${OLD}?`, `v${NEW}?`],                                     // fejlfindingsraekker
]);
planReplace("extension.js", [[`L.active("v${OLD}")`, `L.active("v${NEW}")`]]);

console.log("\nRelease-noter:\n" + notes.replace(/^/gm, "  ") + "\n");
for (const e of edits) step(`${e.file}: ${e.summary}`);
step(`CHANGELOG.md: ${iNew >= 0 ? `bruger "## [${NEW}]"` : `"## [Unreleased]" → "## [${NEW}] - ${today}"`}`);

if (DRY) {
  console.log(`\n--dry-run: intet aendret. Uden flaget: commit "Release ${NEW}", tag ${TAG}, push, Actions-release, install.`);
  process.exit(0);
}

// Rul ALT foer push tilbage: preflight garanterede main == origin/main og rent trae,
// saa reset til origin/main er praecis udgangspunktet. Fjerner ogsaa evt. lokal tag og ny .vsix.
function rollback() {
  try { git("tag", "-d", TAG); } catch { /* fandtes ikke */ }
  try { git("reset", "-q", "--hard", "origin/main"); } catch { /* bedste forsoeg */ }
  try { if (existsSync(VSIX_NEW)) unlinkSync(VSIX_NEW); } catch { /* ok */ }
}
function abort(msg) { rollback(); fail(`${msg}\n  Alle aendringer er rullet tilbage - intet er committet.`); }

writeFileSync("CHANGELOG.md", clLines.join("\n"), "utf8");
for (const e of edits) writeFileSync(e.file, e.content, "utf8");

// ------------------------------------------------------------------- checks
step("node check-docs.mjs");
attempt(() => console.log("  " + sh("node check-docs.mjs")), () => abort("check-docs.mjs fejlede (se ovenfor)"));

// ------------------------------------------------------------------ package
// Samme pinnede vsce-version som .github/workflows/release.yml.
step("npx @vscode/vsce@3.9.2 package");
attempt(() => console.log("  " + sh("npx --yes @vscode/vsce@3.9.2 package").split("\n").pop().trim()),
        () => abort("vsce package fejlede (se ovenfor)"));
if (!existsSync(VSIX_NEW)) abort(`${VSIX_NEW} blev ikke dannet`);
attempt(() => {
  if (git("ls-files", VSIX_OLD)) git("rm", "-q", VSIX_OLD);
  git("add", "-A");
}, (m) => abort(`git add/rm fejlede: ${m}`));

// ------------------------------------------------------------- commit + tag
const releaseNotes = attempt(() => sh("node release-notes.mjs"), () => abort("release-notes.mjs fejlede"));
attempt(() => git("commit", "-q", "-m", `Release ${NEW}`, "-m", releaseNotes), (m) => abort(`git commit fejlede: ${m}`));
attempt(() => git("tag", "-a", TAG, "-m", `Bridge for IBM i ${NEW}`), (m) => abort(`git tag fejlede: ${m}`));
step(`Commit ${git("rev-parse", "--short", "HEAD")} "Release ${NEW}" + tag ${TAG}`);

if (NO_PUSH) {
  console.log(`\n--no-push: intet pushet. Naar du er klar:\n${PUSH_HINT}`);
  process.exit(0);
}

// --------------------------------------------------------------------- push
// Herfra rulles intet tilbage: committen er gyldig - kun pushet mangler.
attempt(() => git("push", "origin", "main"),
        (m) => fail(`git push main fejlede: ${m}\n  Commit og tag ligger lokalt og er gyldige. Proev igen med:\n${PUSH_HINT}`));
attempt(() => git("push", "origin", TAG),
        (m) => fail(`git push ${TAG} fejlede: ${m}\n  main er pushet; kun tagget mangler (det udloeser releasen):\n  git push origin ${TAG}`));
step(`Pushet main + ${TAG} → GitHub Actions bygger releasen`);

// ------------------------------------------------------------ follow Actions
// Uautentificeret API: 60 kald/time. 20 s interval i max 10 min = 30 kald.
const api = `https://api.github.com/repos/${OWNER}/${REPO}/actions/runs?event=push&branch=${encodeURIComponent(TAG)}&per_page=5`;
const ACTIONS_URL = `https://github.com/${OWNER}/${REPO}/actions`;
const deadline = Date.now() + 10 * 60 * 1000;
let run = null, announced = false, polls = 0;
while (Date.now() < deadline) {
  try {
    const r = await fetch(api, { headers: { "User-Agent": "bridge-for-i-release", Accept: "application/vnd.github+json" } });
    if (r.status === 403 || r.status === 429) {
      console.log(`  GitHub API svarede ${r.status} (rate limit?) - venter og proever igen. Se selv: ${ACTIONS_URL}`);
    } else {
      const runs = (await r.json()).workflow_runs || [];
      const found = runs.find((x) => x.head_branch === TAG);
      if (found) {
        if (!announced) { announced = true; step(`Actions: ${found.html_url}`); }
        if (found.status === "completed") { run = found; break; }
      }
    }
  } catch { /* forbigaaende netvaerksfejl - proev igen */ }
  polls++;
  if (polls % 3 === 0) console.log(`  venter paa Actions (${polls * 20} s) …`);
  await new Promise((res) => setTimeout(res, 20000));
}
if (!run) fail(`Actions-koerslen for ${TAG} blev ikke faerdig inden for 10 min - se ${ACTIONS_URL}`);
if (run.conclusion !== "success")
  fail(`Actions-koerslen endte med "${run.conclusion}": ${run.html_url}\n  Commit og tag er pushet. Ret fejlen, og flyt tagget: git tag -d ${TAG} && git push origin :refs/tags/${TAG}`);
step(`Release oprettet: ${RELEASE_URL}`);

// ------------------------------------------------------------------ install
if (NO_INSTALL) {
  console.log(`\n--no-install: installer selv med  code --install-extension ${VSIX_NEW} --force`);
} else {
  step(`code --install-extension ${VSIX_NEW} --force`);
  try {
    const out = sh(`code --install-extension ${VSIX_NEW} --force`);
    console.log("  " + (out.split("\n").find((l) => /installed/i.test(l)) || out.split("\n").pop()).trim());
    console.log("  Genindlaes VS Code-vinduet (Developer: Reload Window) for at aktivere den nye version.");
  } catch {
    console.error(`  Install fejlede - koer selv: code --install-extension ${VSIX_NEW} --force`);
  }
}
console.log(`\n✓ ${NEW} er udgivet: ${RELEASE_URL}`);
