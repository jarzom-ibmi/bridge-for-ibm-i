# Changelog

All notable changes to the **Bridge for IBM i** extension are documented in
this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versions follow [Semantic Versioning](https://semver.org/).
> Versions 0.4.1 and earlier were published under the name **Claude Member Bridge**.


## [Unreleased]

### Fixed
- **Pull did nothing** on connections where the SQL runner is unavailable: the
  member list was fetched with SQL only and the error was swallowed. The list
  now falls back to Code for IBM i's own `getMemberList` (which has a non-SQL
  path), and every pull failure is logged in the output panel and shown as an
  error message instead of failing silently.

## [0.10.2] - 2026-08-27

### Changed
- Folder upload: when every file is unchanged since the last pull/upload, the
  summary now offers **Upload all anyway** (bypasses the content-hash guard).
  The output panel logs what the command received, how many local files it
  found and why it stopped.

## [0.10.1] - 2026-08-27

### Added
- **Upload folder to IBM i (all members)** is now also in the Object Browser
  right-click menu: on a source file it uploads the mirrored `ibmi/LIB/SRCFILE`
  folder, on a member just that one local file.

## [0.10.0] - 2026-08-27

### Added
- **Upload folder to IBM i (all members)**: right-click a folder in the
  Explorer to upload a whole source file (`ibmi/LIB/SRCFILE`), a whole library
  (`ibmi/LIB`) or the entire mirror in one go. Unchanged files are skipped, new
  files become new members (ADDPFM), conflicts are asked once with
  "Overwrite all" / "Skip all", progress can be cancelled and a summary is
  shown at the end. Also available from the command palette (uses the active
  file's folder, or asks `LIB/SRCFILE`).

### Changed
- `release.mjs`: clear guidance instead of a stack trace when a git step or the
  push fails (everything before the push is rolled back), `--help`, `vX.Y.Z`
  accepted, README version bump limited to the exact patterns the docs check
  watches, and a narrower, rate-limit-friendly GitHub Actions lookup.
- Supply-chain hardening: the release workflow pins its GitHub Actions to
  commit SHAs (`checkout` v4.4.0, `setup-node` v4.4.0, `action-gh-release`
  v2.6.2) and `@vscode/vsce` to 3.9.2 everywhere it is invoked (workflow,
  `release.mjs`, README).

## [0.9.2] - 2026-08-25

### Added
- `release.mjs`: one command (`node release.mjs patch|minor|major`) bumps the
  version everywhere, runs the docs check, builds the .vsix, commits, tags,
  pushes, follows the GitHub Actions release run and installs the new build.
  Shortcuts: `npm run check`, `npm run release -- patch`.

## [0.9.1] - 2026-08-25

### Added
- **Open manual** in the right-click menu of *Bridge for IBM i* in the
  Extensions view, and clickable *Open manual* / *Show output* links in the
  tooltip of the status bar item — no need to type the command.

### Changed
- `README.md` is now the complete guide (English + Danish), so it appears on
  the extension page's **Details** tab. `MANUAL.md` is gone; **Open manual**
  opens the bundled README as a Markdown preview.

## [0.9.0] - 2026-08-25

### Added
- Command **Open manual** (Danish: *Åbn vejledning*) opens `MANUAL.md` in a
  Markdown preview tab inside VS Code; on a Danish UI it jumps straight to the
  Danish section. `MANUAL.md` is now included in the `.vsix`.
- Source code published on GitHub: https://github.com/jarzom-ibmi/bridge-for-ibm-i
  (`repository`, `homepage` and `bugs` fields in the manifest).

## [0.8.2] - 2026-08-24

### Added
- Author contact e-mail (jarzom@gmail.com) in the extension manifest and the
  README.

## [0.7.3] - 2026-08-24

### Changed
- Danish terminology for connection binding: "knytte/knyttet til" replaces
  "binde/bundet til" - in particular the awkward "binde spejlet om" is now
  "knytte spejlet til den aktive forbindelse". Button, dialogs, tooltip, log
  and documentation all follow. English wording ("bound"/"rebind") unchanged.

## [0.7.2] - 2026-08-24

### Changed
- Danish translations polished throughout runtime messages and documentation:
  "skrivebeskyttet (readonly)", "uden om editoren", "kolonnefølsomme",
  "fortrydelsesmulighed", clearer compile/upload error wording, and
  "koble sig direkte på Code for IBM i" instead of the anglicism.

### Fixed
- The pull confirmation said "ready for Claude" / "klar til Claude" in both
  languages - the last agent-specific runtime string. It now says "ready for
  the AI agent" / "klar til AI-agenten".

## [0.7.1] - 2026-08-24

### Fixed
- Documentation quoted the pre-0.5.0 command titles "(for Claude)" / "(til
  Claude)"; the actual menu items have said "(for AI)" / "(til AI)" since the
  rename. README and MANUAL now match the real UI, and the docs check
  cross-references the titles against the NLS files so this cannot drift again.

## [0.7.0] - 2026-08-07

### Changed
- **Display name is now "Bridge for IBM i"** (following the platform's official
  casing, as in "Code for IBM i"). Technical identifiers are deliberately
  unchanged (`bridge-for-i`, `bridgeForI.*`), so this version upgrades in
  place - no uninstall, settings and keybindings intact.
- The watcher's log line is now agent-neutral: "including writes made outside
  the editor, e.g. by AI agents" (previously named Claude Code specifically).

## [0.6.0] - 2026-08-07

### Added
- **Connection binding**: the mirror records which Code for IBM i connection it
  belongs to in `.bridge.json`. Uploads and re-pulls against a *different*
  connection are blocked with a clear message; pulling offers to rebind. A new
  **status bar item** always shows the active connection - with a warning color
  when it does not match the mirror's binding. Click it to open the log.
- **Show differences** option in the conflict dialog: opens a diff between the
  member as it is on the IBM i right now and your local file, so you can see
  what changed before deciding.
- Every compile result (success or failure) is written to `.compile/last.txt`
  in the mirror, so AI agents can read the errors and fix them on their own.
  The generated CLAUDE.md/AGENTS.md instruct agents to do exactly that.

### Fixed
- Content hashes now persist across VS Code restarts, so the first save after a
  restart no longer re-uploads an unchanged file (which would needlessly move
  the member's last-change timestamp).

## [0.5.0] - 2026-08-07

### Changed
- **Renamed to "Bridge for i"** — the bridge has been agent-agnostic since
  0.3.0, and the name now says so. Command and setting identifiers changed
  from `claudeMemberBridge.*` to `bridgeForI.*`.
- Logo recolored: the coral tower is now **IBM blue** (Carbon Blue 60,
  `#0F62FE`) with a white prompt; cables and deck shifted to a cool white.

### Added
- Settings migration: `bridgeForI.*` settings fall back to your existing
  `claudeMemberBridge.*` values until you move them, so nothing breaks.

### Migration
- The rename changes the extension ID. **Uninstall the old
  "Claude Member Bridge"** after installing this version — two bridges
  watching the same mirror would upload every change twice.

## [0.4.1] - 2026-08-07

### Added
- This changelog, shown by VS Code in the extension's *Changelog* tab.

## [0.4.0] - 2026-08-07

### Added
- **Conflict guard**: before uploading, the bridge compares the member's
  last-change timestamp on the IBM i with the baseline recorded at pull/last
  upload. If the member changed on the host, a modal warning offers
  *Overwrite member* or cancel. Fail-open by design: if the check itself fails
  (VPN down, authority), the upload proceeds. Setting:
  `claudeMemberBridge.conflictCheck` (default `true`). Baselines persist in
  workspace state across VS Code restarts.
- Command **Pull current file again (overwrite local)** — re-downloads the
  member and refreshes hash and baseline; the natural companion to the
  conflict guard.
- **Wildcard pull**: `LIB/SRCFILE/ORD*` pulls all matching members instead of
  the whole source file.

## [0.3.0] - 2026-08-07

### Added
- **AGENTS.md** is now generated alongside CLAUDE.md on first pull — generic
  instructions for any AI agent or tool (the emerging cross-tool convention
  read by Codex, Cursor and others). Both files are excluded from auto-upload
  and never overwritten if they already exist.

### Changed
- Documentation clarifies that the bridge is agent-agnostic: editor-based
  agents are caught by the save hook, disk-writing CLI agents by the
  filesystem watcher. Nothing in the bridge talks to any AI.

## [0.2.1] - 2026-08-07

### Added
- Extension **icon** (a suspension bridge between a green-screen tower and a
  terminal-prompt tower — the silhouette forms an "M" for *Member*), shipped
  as PNG and referenced from the manifest; scalable SVG source included.
- Comprehensive bilingual manual (`MANUAL.md`) and `.vscodeignore` to keep the
  packaged .vsix lean.

## [0.2.0] - 2026-08-07

### Added
- **Bilingual UI**: English is the default; all commands, settings, log lines,
  prompts and the generated instruction file switch to Danish when VS Code's
  display language is Danish. Package metadata localized via
  `package.nls.json` / `package.nls.da.json`; runtime messages moved to a
  testable `messages.js`.
- Author: **Glenn Jarzomkowski** (manifest).
- Bilingual README (English first).

## [0.1.2] - 2026-08-07

### Added
- Compile support for **RPG III** (`.rpg` → `CRTRPGPGM`) and `.cl`
  (`CRTCLPGM`).
- **Multi-root workspaces**: the mirror folder is now looked up in every
  workspace folder, with one filesystem watcher per folder.

### Fixed
- Rejections are no longer silent: the save hook logs *why* a file was not
  uploaded (wrong depth, outside the mirror folder, missing extension).

## [0.1.1] - 2026-08-07

### Fixed
- **Ctrl+S did not upload** on some setups: v0.1.0 relied solely on a
  filesystem watcher, which is platform-dependent. The editor save hook is
  back as a first-class path; the watcher remains for direct disk writes
  (e.g. Claude Code). A shared content-hash guard prevents double uploads.

### Added
- Timestamped logging of every event and decision in the **"IBM i Bridge"**
  output channel.
- Command **Upload current file to IBM i** — manual fallback and diagnostic.

## [0.1.0] - 2026-08-06

### Added
- Initial release. Piggybacks on **Code for IBM i**: same connection, same
  CCSID handling, same member filesystem — no separate SSH setup.
- **Pull** members to the workspace as `ibmi/LIBRARY/SOURCEFILE/MEMBER.type`
  via Object Browser context menu or command.
- **Auto-upload** of changed mirrored files (debounced, unchanged content
  skipped); missing members are created automatically with the correct
  SRCTYPE (`ADDPFM` fallback).
- **Compile current file** with the matching CRT command (RPGLE, SQLRPGLE,
  CLLE, CLP, CMD, SQL, PF, LF, DSPF, PRTF) using the connection's library
  list.
- `CLAUDE.md` with the rules of the mirror is generated on first pull.
- Clear error message when the Code for IBM i connection is in read-only mode.
