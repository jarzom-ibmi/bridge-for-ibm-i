# Bridge for IBM i

**Author: Glenn Jarzomkowski**

A small VS Code extension that lets AI coding agents (Claude Code, Codex,
Copilot, …) work with classic IBM i source members (`LIBRARY/SOURCEFILE/MEMBER`) by piggybacking on
[Code for IBM i](https://codefori.github.io/docs/). Same connection, same CCSID
handling, same member filesystem — no separate SSH setup.

*Dansk version nedenfor.*

## What it does

- **Pull**: right-click a member or a source physical file in the Object Browser
  ("Pull to workspace (for AI)"), or run "IBM i Bridge: Pull member(s)".
  Members are read through Code for IBM i's member filesystem and written as
  `ibmi/LIBRARY/SOURCEFILE/MEMBER.type` in your workspace — real files that
  any AI agent can see and edit.
- **Auto-upload**: the bridge watches the mirror folder at the *filesystem*
  level. That matters: CLI agents like Claude Code write files directly to disk,
  outside the editor. Any change — yours (Ctrl+S) or Claude's — is uploaded after about a
  second of quiet; unchanged content is skipped. Missing members are created
  automatically with the correct SRCTYPE.
- **Compile**: "IBM i Bridge: Compile current file" saves, uploads and runs the
  right CRT command (RPGLE, SQLRPGLE, RPG, CLLE, CLP/CL, CMD, SQL, PF, LF, DSPF,
  PRTF) using the connection's library list. Output in the "IBM i Bridge" panel.
- The first pull drops `CLAUDE.md` and `AGENTS.md` into the mirror folder so
  any agent knows the rules of the road.
- Everything the bridge does — and every rejection, with the reason — is logged
  with timestamps in **View → Output → "IBM i Bridge"**.

- **Connection-bound.** The mirror remembers which Code for IBM i connection it
  belongs to (`.bridge.json`); uploads to a different connection are blocked,
  and a status bar item always shows where uploads go.
- Every compile result is also written to `.compile/last.txt`, so AI agents can
  read the errors and fix them on their own.

English is the default language; the UI and log switch to Danish automatically
when VS Code's display language is Danish.

## Install

Requires VS Code with Code for IBM i installed and connected.

```bash
code --install-extension bridge-for-i-0.9.0.vsix
```
> **Upgrading from Claude Member Bridge (≤ 0.4.1)?** Uninstall it first — the
> rename changed the extension ID, and two bridges watching the same mirror
> would upload everything twice. Your old settings are read automatically.


Or in VS Code: Extensions panel → the "…" menu → *Install from VSIX…*. Reload
the window and verify in **View → Output → "IBM i Bridge"** that the first line
reads `Bridge for IBM i v0.9.0 active.` Optionally set
`bridgeForI.targetLibrary` in Settings.

The full guide ships with the extension: run **IBM i Bridge: Open manual**
from the Command Palette (Ctrl+Shift+P), or read
[MANUAL.md](https://github.com/jarzom-ibmi/bridge-for-ibm-i/blob/main/MANUAL.md)
on GitHub.

To rebuild the .vsix from source:

```bash
npx --yes @vscode/vsce package
```

## Workflow

1. Connect with Code for IBM i as usual
2. Right-click a source file or member → **Pull to workspace (for AI)**
3. Ask your AI agent (e.g. Claude Code) for the change — it edits files under `ibmi/…`
4. Any save or Claude edit uploads automatically (⬆ in the status bar)
5. **IBM i Bridge: Compile current file** → result in the output panel

## Settings

| Setting | Default | Meaning |
|---|---|---|
| `bridgeForI.targetLibrary` | *(empty)* | Library objects are compiled into |
| `bridgeForI.mirrorFolder` | `ibmi` | Workspace folder for mirrored members |
| `bridgeForI.autoUploadOnSave` | `true` | Upload automatically on change |
| `bridgeForI.conflictCheck` | `true` | Warn before overwriting a member changed on the host |

## Troubleshooting

Open **View → Output → "IBM i Bridge"**. The first line shows the version.
Every save and watcher event is logged, including rejections with the reason
(wrong depth, outside the mirror folder, not connected, read-only mode, …).
The command **Upload current file to IBM i** is both a manual fallback and a
quick diagnostic.

## Caveats

- Verified against the vscode-ibmi source code (member FileSystemProvider,
  runCommand, runSQL, tree node shapes), but your Code for IBM i version may
  vary — the right-click handler probes defensively and falls back to a prompt.
- No version control on the member itself: the local file is your undo. Using
  git in the mirror folder is strongly recommended.
- If someone changes the member on the system while you have it mirrored, the
  last save wins. Pull again before larger work.
- Multi-root workspaces are supported; the mirror folder is looked up in every
  workspace folder.

## License

MIT © 2026 Glenn Jarzomkowski (jarzom@gmail.com). Not affiliated with or
endorsed by IBM.

---

# Dansk

**Forfatter: Glenn Jarzomkowski**

En lille VS Code-udvidelse der lader AI-agenter (Claude Code, Codex,
Copilot, …) arbejde med klassiske IBM i source members (`BIBLIOTEK/KILDEFIL/MEMBER`) ved at koble sig direkte på
[Code for IBM i](https://codefori.github.io/docs/). Samme forbindelse, samme
CCSID-håndtering, samme member-filsystem — ingen separat SSH-opsætning.

## Hvad den gør

- **Pull**: højreklik på et member eller en kildefil i Object Browser
  ("Pull til workspace (til AI)"), eller kør "IBM i Bridge: Pull member(s)".
  Members læses gennem Code for IBM i's member-filsystem og lægges som
  `ibmi/BIBLIOTEK/KILDEFIL/MEMBER.type` i workspacet — rigtige filer som Claude
  Code kan se og redigere.
- **Auto-upload**: broen overvåger spejlmappen på *filsystem*-niveau. Det er
  afgørende: CLI-agenter som Claude Code skriver filer direkte på disken uden om
  editoren.
  Enhver ændring — din (Ctrl+S) eller Claudes — uploades efter ca. et sekunds
  ro; uændret indhold springes over. Manglende members oprettes automatisk med
  korrekt SRCTYPE.
- **Compile**: "IBM i Bridge: Kompilér aktuel fil" gemmer, uploader og kører den
  rigtige CRT-kommando (RPGLE, SQLRPGLE, RPG, CLLE, CLP/CL, CMD, SQL, PF, LF,
  DSPF, PRTF) med forbindelsens biblioteksliste. Output i panelet "IBM i Bridge".
- Første pull lægger `CLAUDE.md` og `AGENTS.md` i spejlmappen, så enhver agent
  kender reglerne.
- Alt broen gør — og enhver afvisning, med årsag — logges med tidsstempel i
  **View → Output → "IBM i Bridge"**.

- **Knyttet til forbindelsen.** Spejlet husker hvilken Code for IBM i-forbindelse det
  hører til (`.bridge.json`); uploads til en anden forbindelse blokeres, og en
  statuslinje viser altid hvor uploads går hen.
- Hvert compile-resultat skrives også til `.compile/last.txt`, så AI-agenter
  selv kan læse fejlene og rette dem.

Engelsk er standardsproget; brugerflade og log skifter automatisk til dansk,
når VS Codes visningssprog er dansk.

## Installation

Kræver VS Code med Code for IBM i installeret og forbundet.

```bash
code --install-extension bridge-for-i-0.9.0.vsix
```
> **Opgraderer du fra Claude Member Bridge (≤ 0.4.1)?** Afinstallér den først —
> omdøbningen ændrede extension-ID'et, og to broer på samme spejl ville uploade
> alt dobbelt. Dine gamle indstillinger læses automatisk.


Eller i VS Code: Extensions-panelet → "…"-menuen → *Install from VSIX…*.
Genindlæs vinduet og tjek i **View → Output → "IBM i Bridge"** at første linje
siger `Bridge for IBM i v0.9.0 aktiv.` Sæt evt. `bridgeForI.targetLibrary`
i Settings.

Den fulde vejledning følger med extensionen: kør **IBM i Bridge: Åbn vejledning**
fra Command Palette (Ctrl+Shift+P), eller læs
[MANUAL.md](https://github.com/jarzom-ibmi/bridge-for-ibm-i/blob/main/MANUAL.md)
på GitHub.

## Arbejdsgang

1. Forbind med Code for IBM i som du plejer
2. Højreklik på en kildefil eller et member → **Pull til workspace (til AI)**
3. Bed din AI-agent (fx Claude Code) om ændringen — den redigerer filer under `ibmi/…`
4. Ethvert gem eller enhver Claude-redigering uploades automatisk (⬆ i statuslinjen)
5. **IBM i Bridge: Kompilér aktuel fil** → resultat i outputpanelet

## Indstillinger

| Indstilling | Standard | Betydning |
|---|---|---|
| `bridgeForI.targetLibrary` | *(tom)* | Bibliotek der kompileres til |
| `bridgeForI.mirrorFolder` | `ibmi` | Mappe i workspacet hvor members spejles |
| `bridgeForI.autoUploadOnSave` | `true` | Upload automatisk ved ændring |
| `bridgeForI.conflictCheck` | `true` | Advar før overskrivning af et member der er ændret på systemet |

## Fejlfinding

Åbn **View → Output → "IBM i Bridge"**. Første linje viser versionen. Hvert gem
og hver watcher-hændelse logges, inklusive afvisninger med årsag (forkert dybde,
udenfor spejlmappen, ikke forbundet, skrivebeskyttet (readonly), …). Kommandoen **Upload
aktuel fil til IBM i** er både manuel nødudgang og hurtig diagnose.

## Forbehold

- Verificeret mod vscode-ibmi's kildekode, men din version af Code for IBM i kan
  afvige — højreklik-handleren leder defensivt og falder tilbage til at spørge.
- Ingen versionsstyring på selve memberet: den lokale fil er din eneste fortrydelsesmulighed.
  Git i spejlmappen anbefales stærkt.
- Ændrer nogen memberet på systemet mens du har det spejlet, vinder den der
  gemmer sidst. Pull igen før større arbejde.
- Multi-root workspaces understøttes; spejlmappen findes i alle workspace-mapper.

## Licens

MIT © 2026 Glenn Jarzomkowski (jarzom@gmail.com). Ikke tilknyttet eller
godkendt af IBM.
