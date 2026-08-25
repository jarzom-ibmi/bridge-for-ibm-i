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
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { execFileSync, execSync } from "node:child_process";

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const spec = args.find((a) => !a.startsWith("--"));
const DRY = flags.has("--dry-run");
const NO_PUSH = flags.has("--no-push");
const NO_INSTALL = flags.has("--no-install");
for (const f of flags) if (!["--dry-run", "--no-push", "--no-install"].includes(f)) fail(`Ukendt flag ${f}`);

function fail(msg) { console.error("✗ " + msg); process.exit(1); }
function step(msg) { console.log("• " + msg); }
function git(...a) {
  return execFileSync("git", a, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function sh(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
}

if (!spec) fail("Brug: node release.mjs patch|minor|major|X.Y.Z [--dry-run] [--no-push] [--no-install]");

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
  spec === "major" ? `${ma + 1}.0.0` : spec;
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

// ---------------------------------------------------------------- preflight
step(`Preflight: ${OLD} → ${NEW} (${TAG})`);
const branch = git("rev-parse", "--abbrev-ref", "HEAD");
if (branch !== "main") fail(`Du staar paa "${branch}" - releases laves fra main`);
if (git("status", "--porcelain"))
  fail("Arbejdstraeet er ikke rent. Commit eller stash dit arbejde foerst - release-committen maa kun indeholde version-bump'et.");
git("fetch", "origin", "--tags");
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
// Maalrettede erstatninger i praecis de filer check-docs.mjs overvaager.
const edits = [];
function planReplace(file, from, to) {
  const s = readFileSync(file, "utf8");
  const n = s.split(from).length - 1;
  if (n < 1) fail(`${file}: fandt ikke "${from}"`);
  edits.push({ file, content: s.split(from).join(to), n, from, to });
}
planReplace("package.json", `"version": "${OLD}"`, `"version": "${NEW}"`);
planReplace("README.md", OLD, NEW);
planReplace("extension.js", `L.active("v${OLD}")`, `L.active("v${NEW}")`);

console.log("\nRelease-noter:\n" + notes.replace(/^/gm, "  ") + "\n");
for (const e of edits) step(`${e.file}: ${e.n} × "${e.from}" → "${e.to}"`);
step(`CHANGELOG.md: ${iNew >= 0 ? `bruger "## [${NEW}]"` : `"## [Unreleased]" → "## [${NEW}] - ${today}"`}`);

if (DRY) {
  console.log(`\n--dry-run: intet aendret. Uden flaget: commit "Release ${NEW}", tag ${TAG}, push, Actions-release, install.`);
  process.exit(0);
}

function rollback() {
  try { git("checkout", "--", "."); } catch { /* bedste forsoeg */ }
  try { if (existsSync(VSIX_NEW)) unlinkSync(VSIX_NEW); } catch { /* ok */ }
}

writeFileSync("CHANGELOG.md", clLines.join("\n"), "utf8");
for (const e of edits) writeFileSync(e.file, e.content, "utf8");

// ------------------------------------------------------------------- checks
step("node check-docs.mjs");
try {
  console.log("  " + sh("node check-docs.mjs"));
} catch {
  rollback();
  fail("check-docs.mjs fejlede - alle aendringer er rullet tilbage");
}

// ------------------------------------------------------------------ package
step("npx @vscode/vsce package");
try {
  const out = sh("npx --yes @vscode/vsce package");
  console.log("  " + out.split("\n").pop().trim());
} catch {
  rollback();
  fail("vsce package fejlede - alle aendringer er rullet tilbage");
}
if (!existsSync(VSIX_NEW)) { rollback(); fail(`${VSIX_NEW} blev ikke dannet`); }
if (git("ls-files", VSIX_OLD)) git("rm", "-q", VSIX_OLD);
git("add", "-A");

// ------------------------------------------------------------- commit + tag
const releaseNotes = sh("node release-notes.mjs");
git("commit", "-q", "-m", `Release ${NEW}`, "-m", releaseNotes);
git("tag", "-a", TAG, "-m", `Bridge for IBM i ${NEW}`);
step(`Commit ${git("rev-parse", "--short", "HEAD")} "Release ${NEW}" + tag ${TAG}`);

if (NO_PUSH) {
  console.log(`\n--no-push: intet pushet. Naar du er klar:\n  git push origin main\n  git push origin ${TAG}`);
  process.exit(0);
}

// --------------------------------------------------------------------- push
git("push", "origin", "main");
git("push", "origin", TAG);
step(`Pushet main + ${TAG} → GitHub Actions bygger releasen`);

// ------------------------------------------------------------ follow Actions
const api = `https://api.github.com/repos/${OWNER}/${REPO}/actions/runs?per_page=5`;
const deadline = Date.now() + 10 * 60 * 1000;
let run = null, announced = false;
while (Date.now() < deadline) {
  try {
    const r = await fetch(api, { headers: { "User-Agent": "bridge-for-i-release", Accept: "application/vnd.github+json" } });
    const runs = (await r.json()).workflow_runs || [];
    const found = runs.find((x) => x.head_branch === TAG);
    if (found) {
      if (!announced) { announced = true; step(`Actions: ${found.html_url}`); }
      if (found.status === "completed") { run = found; break; }
    }
  } catch { /* forbigaaende netvaerksfejl - proev igen */ }
  await new Promise((res) => setTimeout(res, 15000));
}
if (!run) fail(`Actions-koerslen for ${TAG} blev ikke faerdig inden for 10 min - se https://github.com/${OWNER}/${REPO}/actions`);
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
