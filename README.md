# Bridge for IBM i

**Version 0.9.1 · Author: Glenn Jarzomkowski · License: MIT**

A small VS Code extension that lets AI coding agents (Claude Code, Codex,
Copilot, …) work with classic IBM i source members (`LIBRARY/SOURCEFILE/MEMBER`) by piggybacking on
[Code for IBM i](https://codefori.github.io/docs/). Same connection, same CCSID
handling, same member filesystem — no separate SSH setup.

*[English](#1-what-it-is) · [Dansk](#bridge-for-ibm-i--komplet-vejledning-dansk)*

---

## 1. What it is

AI coding agents — Claude Code, Codex, Copilot and every other tool — work on
ordinary files on disk. Classic IBM i source code lives in **source members**
inside QSYS.LIB (`LIBRARY/SOURCEFILE/MEMBER`) — EBCDIC, fixed record length,
no file extension. None of them can see members.

Bridge for IBM i closes that gap by **piggybacking on Code for IBM i**:
it uses the connection you already have and Code for IBM i's own member
filesystem (which handles all CCSID conversion), mirrors members as real local
files, and pushes every change back automatically.

```
IBM i (QSYS.LIB)                VS Code                      Disk
LIB/SRCFILE(MEMBER)  ◄──────►  Code for IBM i  ◄──────►  ibmi/LIB/SRCFILE/
                                     ▲                     MEMBER.type
                                     │                          ▲
                              Bridge for IBM i              │
                              (pull · watch · upload            │
                               · compile)                AI agents edit
                                                          ordinary files
```

Key properties:

- **No separate SSH setup.** Login, VPN and CCSID handling are Code for IBM i's.
- **Two upload paths.** Ctrl+S in the editor uploads instantly; a filesystem
  watcher catches direct disk writes from CLI agents such as Claude Code. A shared content-hash guard
  prevents duplicate uploads.
- **Members are created on demand** with the correct SRCTYPE when you (or
  Claude) add a new file in the mirror.
- **Connection-bound.** The mirror records which Code for IBM i connection it
  belongs to (`.bridge.json`); uploads against a different connection are
  blocked, and a status bar item always shows where uploads go.
- **Compile results as a file.** Every compile is also written to
  `.compile/last.txt`, so AI agents can read the errors and fix them on their
  own.
- **Fully logged.** Every action and every rejection — with the reason — is
  written to the output panel **"IBM i Bridge"**.
- **Bilingual.** English by default; the UI and log switch to Danish when
  VS Code's display language is Danish.

## 2. Requirements

| | |
|---|---|
| VS Code | 1.80 or newer |
| Code for IBM i | installed and able to open members in the Object Browser |
| IBM i authority | read/write on the source files you mirror; use of the CRT commands you compile with |
| An AI agent (e.g. Claude Code) | optional but the point — any tool that edits files works |

## 3. Installation

1. Get `bridge-for-i-0.9.1.vsix`.
2. Install it — either from the command line:

   ```bash
   code --install-extension bridge-for-i-0.9.1.vsix
   ```
> **Upgrading from Claude Member Bridge (≤ 0.4.1)?** Uninstall it first — the
> rename changed the extension ID, and two bridges watching the same mirror
> would upload everything twice. Your old settings are read automatically.


   or in VS Code: **Extensions panel → "…" menu → Install from VSIX…**
3. Reload the window (**Developer: Reload Window**).
4. Verify: **View → Output → "IBM i Bridge"** — the first line must read
   `Bridge for IBM i v0.9.1 active.`
5. Recommended: **Settings → search "IBM i Bridge" → Target Library**
   = the library you compile into (e.g. `MYLIB`).

Upgrading later: install the newer .vsix the same way — the extension ID is
stable, so it upgrades in place.

Uninstall: Extensions panel → Bridge for IBM i → Uninstall. The mirrored
files under `ibmi/` are yours and remain untouched.

To rebuild the .vsix from source:

```bash
npx --yes @vscode/vsce package
```

**Reading this guide inside VS Code.** It is the *Details* tab of the
extension page (Extensions panel → Bridge for IBM i). To open it as a
Markdown preview tab instead: right-click *Bridge for IBM i* in the Extensions
list → **Open manual**, click *Open manual* in the tooltip of the `Bridge: …`
status bar item, or run **IBM i Bridge: Open manual** from the Command Palette
(Ctrl+Shift+P).

## 4. First five minutes

1. Open a folder as your workspace (the mirror lives inside it).
2. Connect with Code for IBM i as usual.
3. In the **Object Browser**, right-click a source physical file (or a single
   member) → **Pull to workspace (for AI)**. Alternatively press
   Ctrl+Shift+P → *IBM i Bridge: Pull member(s)* and type `MYLIB/QRPGLESRC`.
4. The members appear as `ibmi/MYLIB/QRPGLESRC/NAME.type`, and `CLAUDE.md` +
   `AGENTS.md` with the rules are dropped into the mirror folder.
5. Open a file, change one character, press **Ctrl+S** → the status bar shows
   `⬆ MYLIB/QRPGLESRC(NAME)` and the log shows the upload.
6. Ctrl+Shift+P → **IBM i Bridge: Compile current file** → result in the
   output panel.
7. Sanity check the member in Code for IBM i or SEU: national characters and
   column alignment must be intact. If they are, the whole CCSID chain is fine.

## 5. Working with AI agents

Claude Code is the example below; any other agent follows the same flow and
reads the generated `AGENTS.md` instead. Start `claude` in the workspace — the
generated `CLAUDE.md` already tells it how the mirror works, so plain requests
do the right thing:

> *"Read DATCHK in ibmi/PPSSRCER/QRPGSRC and fix the date validation for
> leap years."*

Claude edits the local file → the watcher uploads it (~1 s after the last
write) → you compile, and the agent can read `.compile/last.txt` to fix any
errors itself. You can also ask Claude to explain a member, add a new
one (it must follow the `ibmi/LIB/SRCFILE/NAME.type` layout, name ≤ 10 chars),
or search across the pulled sources with its own grep.

Good practice: run `git init` in the workspace. The member itself has no
version control — git on the mirror is your history and your undo.

## 6. Command reference

| Command (Ctrl+Shift+P) | Does |
|---|---|
| IBM i Bridge: Pull member(s) to workspace (for AI) | Prompt `LIB/SRCFILE[/MEMBER]`, mirror it |
| Pull to workspace (for AI) *(context menu)* | Same, from Object Browser right-click |
| IBM i Bridge: Compile current file on IBM i | Save + upload + correct CRT command |
| IBM i Bridge: Upload current file to IBM i | Manual upload; also a diagnostic |
| IBM i Bridge: Pull current file again | Re-download the member, overwriting the local file |
| IBM i Bridge: Open manual | Opens this guide in a Markdown preview tab — also in the Extensions-list right-click menu and the status bar tooltip |

Compile picks the command from the file extension: RPGLE→CRTBNDRPG,
SQLRPGLE→CRTSQLRPGI, RPG→CRTRPGPGM, CLLE→CRTBNDCL, CLP/CL→CRTCLPGM,
CMD→CRTCMD, SQL→RUNSQLSTM, PF/LF/DSPF/PRTF→CRTPF/CRTLF/CRTDSPF/CRTPRTF.

### How a compile runs

**Compile current file** does four things in order: the file is saved → it is
uploaded to the member (with connection and conflict checks) → the matching CRT
command runs on the IBM i with the connection's library list → the result is
shown in the "IBM i Bridge" panel *and* written to `.compile/last.txt`. On
success the status bar shows ✔; on failure the compiler's messages are in the
panel. The object is created in the **Target Library** setting; if it is empty
you are prompted each time.

### The AI loop

With an agent in the workspace you rarely touch the palette: ask it to
*"fix the error and compile"*. It edits, the bridge uploads, the compile runs —
and because the result lands in `.compile/last.txt`, the agent reads the errors
and fixes them again until it passes.

### When you need more than the default command

Two alternatives: run **Upload current file** and then your own CL command
through Code for IBM i, or — for full control over parameters (TGTRLS, OPTION,
…) and clickable errors in the Problems panel — use Code for IBM i's own
**Actions** on the member in the Object Browser. The bridge has already
uploaded your version, so Actions compile exactly what you see.

## 7. Settings

| Setting | Default | Meaning |
|---|---|---|
| `bridgeForI.targetLibrary` | *(empty)* | Library objects are compiled into; prompted if empty |
| `bridgeForI.mirrorFolder` | `ibmi` | Mirror folder name inside each workspace folder |
| `bridgeForI.autoUploadOnSave` | `true` | Automatic upload on change |
| `bridgeForI.conflictCheck` | `true` | Warn before overwriting a member that changed on the host |

## 8. Troubleshooting

Everything starts in **View → Output → "IBM i Bridge"**.

| Symptom | Look for / cause |
|---|---|
| Nothing happens on Ctrl+S | Is the first log line v0.9.1? Older versions lacked the save hook. |
| `(save) REJECTED …: wrong depth` | Path must be exactly `ibmi/LIB/SRCFILE/NAME.ext` — three levels |
| `…not located under any ibmi/ folder` | File saved outside the mirror, or `mirrorFolder` setting differs |
| `Code for IBM i is not connected` | Connect first; the bridge reuses that connection |
| `…read-only mode` | Code for IBM i's own connection setting blocks writes |
| `Upload blocked: the mirror is bound to …` | You switched Code for IBM i connection. Switch back, or pull to rebind the mirror |
| Upload fails on a new file | Watch the log: ADDPFM result is shown; check authority and the 10-char name limit |
| Compile fails | The CL error is in the panel; check Target Library and library list |
| Wrong national characters | CCSID problem on the IBM i side (user profile/source file at 65535) — not a bridge setting |

The command **Upload current file to IBM i** is both a manual fallback and a
quick diagnostic.

## 9. Limitations & good practice

- The local file is the only undo — **use git** in the mirror folder.
- If the member changes on the system while mirrored, the conflict guard warns
  you before overwriting - with a *Show differences* option (can be disabled). Use "Pull current file again" to refresh.
- Fixed-format RPG and DDS are column-sensitive: keep indentation exact,
  spaces only, never tabs (the generated CLAUDE.md/AGENTS.md tell the agents the same).
- Multi-root workspaces are supported; the mirror is looked up in every
  workspace folder.
- Verified against the vscode-ibmi source code (member FileSystemProvider,
  runCommand, runSQL, tree node shapes), but your Code for IBM i version may
  vary — the right-click handler probes defensively and falls back to a prompt.

## 10. License

MIT © 2026 Glenn Jarzomkowski (jarzom@gmail.com). Not affiliated with or
endorsed by IBM.

---

---

# Bridge for IBM i — Komplet vejledning (dansk)

**Version 0.9.1 · Forfatter: Glenn Jarzomkowski · Licens: MIT**

En lille VS Code-udvidelse der lader AI-agenter (Claude Code, Codex,
Copilot, …) arbejde med klassiske IBM i source members (`BIBLIOTEK/KILDEFIL/MEMBER`) ved at koble sig direkte på
[Code for IBM i](https://codefori.github.io/docs/). Samme forbindelse, samme
CCSID-håndtering, samme member-filsystem — ingen separat SSH-opsætning.

## 1. Hvad er det

AI-agenter — Claude Code, Codex, Copilot og alle andre værktøjer — arbejder på
almindelige filer på disken. Klassisk IBM i-kildekode ligger i **source
members** i QSYS.LIB (`BIBLIOTEK/KILDEFIL/MEMBER`) — EBCDIC, fast
recordlængde, ingen filendelse. Ingen af dem kan se members.

Bridge for IBM i lukker hullet ved at **koble sig direkte på Code for IBM i**:
den bruger den forbindelse du allerede har og Code for IBM i's eget
member-filsystem (som klarer al CCSID-konvertering), spejler members som
rigtige lokale filer, og sender enhver ændring automatisk tilbage.

```
IBM i (QSYS.LIB)                VS Code                      Disk
LIB/KILDEFIL(MEMBER) ◄──────►  Code for IBM i  ◄──────►  ibmi/LIB/KILDEFIL/
                                     ▲                     MEMBER.type
                                     │                          ▲
                              Bridge for IBM i              │
                              (pull · overvåg · upload          │
                               · compile)                 AI-agenter redigerer
                                                          almindelige filer
```

Nøgleegenskaber:

- **Ingen separat SSH-opsætning.** Login, VPN og CCSID er Code for IBM i's.
- **To upload-veje.** Ctrl+S i editoren uploader med det samme; en
  filsystem-watcher fanger direkte disk-skrivninger fra CLI-agenter som Claude Code. En fælles
  hash-vagt forhindrer dobbelte uploads.
- **Members oprettes efter behov** med korrekt SRCTYPE, når du (eller Claude)
  lægger en ny fil i spejlet.
- **Knyttet til forbindelsen.** Spejlet husker hvilken Code for IBM i-forbindelse det
  hører til (`.bridge.json`); uploads mod en anden forbindelse blokeres, og en
  statuslinje viser altid hvor uploads går hen.
- **Compile-resultater som fil.** Hvert compile skrives også til
  `.compile/last.txt`, så AI-agenter selv kan læse fejlene og rette dem.
- **Fuldt logget.** Enhver handling og enhver afvisning — med årsag — skrives
  i outputpanelet **"IBM i Bridge"**.
- **Tosproget.** Engelsk som standard; brugerflade og log skifter til dansk,
  når VS Codes visningssprog er dansk.

## 2. Forudsætninger

| | |
|---|---|
| VS Code | 1.80 eller nyere |
| Code for IBM i | installeret og i stand til at åbne members i Object Browser |
| IBM i-autorisation | læs/skriv på de kildefiler du spejler; brug af de CRT-kommandoer du kompilerer med |
| En AI-agent (fx Claude Code) | valgfri men hele pointen — alt der redigerer filer virker |

## 3. Installation

1. Hent `bridge-for-i-0.9.1.vsix`.
2. Installér — enten fra kommandolinjen:

   ```bash
   code --install-extension bridge-for-i-0.9.1.vsix
   ```
> **Opgraderer du fra Claude Member Bridge (≤ 0.4.1)?** Afinstallér den først —
> omdøbningen ændrede extension-ID'et, og to broer på samme spejl ville uploade
> alt dobbelt. Dine gamle indstillinger læses automatisk.


   eller i VS Code: **Extensions-panelet → "…"-menuen → Install from VSIX…**
3. Genindlæs vinduet (**Developer: Reload Window**).
4. Verificér: **View → Output → "IBM i Bridge"** — første linje skal sige
   `Bridge for IBM i v0.9.1 aktiv.`
5. Anbefalet: **Settings → søg "IBM i Bridge" → Target Library**
   = biblioteket du kompilerer til (fx `MINLIB`).

Opgradering senere: installér den nyere .vsix på samme måde — extension-ID'et
er stabilt, så den opgraderer på plads.

Afinstallation: Extensions-panelet → Bridge for IBM i → Uninstall. De
spejlede filer under `ibmi/` er dine og røres ikke.

Sådan bygges .vsix'en fra kildekoden:

```bash
npx --yes @vscode/vsce package
```

**Læs denne vejledning inde i VS Code.** Den er *Details*-fanebladet på
extension-siden (Extensions-panelet → Bridge for IBM i). Vil du hellere have
den som en Markdown-preview-fane: højreklik på *Bridge for IBM i* i
Extensions-listen → **Åbn vejledning**, klik på *Åbn vejledning* i tooltip'et
på statuslinjens `Bridge: …`-element, eller kør **IBM i Bridge: Åbn vejledning**
fra Command Palette (Ctrl+Shift+P).

## 4. De første fem minutter

1. Åbn en mappe som workspace (spejlet bor inde i den).
2. Forbind med Code for IBM i som du plejer.
3. I **Object Browser**: højreklik på en kildefil (eller et enkelt member) →
   **Pull til workspace (til AI)**. Alternativt Ctrl+Shift+P →
   *IBM i Bridge: Pull member(s)* og skriv `MINLIB/QRPGLESRC`.
4. Members lander som `ibmi/MINLIB/QRPGLESRC/NAVN.type`, og `CLAUDE.md` +
   `AGENTS.md` med reglerne lægges i spejlmappen.
5. Åbn en fil, ret ét tegn, tryk **Ctrl+S** → statuslinjen viser
   `⬆ MINLIB/QRPGLESRC(NAVN)`, og loggen viser uploaden.
6. Ctrl+Shift+P → **IBM i Bridge: Kompilér aktuel fil** → resultat i panelet.
7. Kontrollér memberet i Code for IBM i eller SEU: æ, ø, å og kolonner skal
   stå rigtigt. Gør de det, er hele CCSID-kæden i orden.

## 5. Arbejde med AI-agenter

Claude Code er eksemplet herunder; enhver anden agent følger samme flow og
læser den genererede `AGENTS.md` i stedet. Start `claude` i workspacet — den
genererede `CLAUDE.md` fortæller den allerede hvordan spejlet virker, så helt
almindelige forespørgsler gør det rigtige:

> *"Læs DATCHK i ibmi/PPSSRCER/QRPGSRC og ret datovalideringen for skudår."*

Claude redigerer den lokale fil → watcheren uploader (~1 s efter sidste
skrivning) → du kompilerer, og agenten kan selv læse `.compile/last.txt` og
rette eventuelle fejl. Du kan også bede Claude forklare et member, oprette
et nyt (skal følge `ibmi/LIB/KILDEFIL/NAVN.type`, navn ≤ 10 tegn) eller søge på
tværs af de hentede kilder med dens egen grep.

Godt håndværk: kør `git init` i workspacet. Selve memberet har ingen
versionsstyring — git på spejlet er din historik og din fortrydelsesmulighed.

## 6. Kommandooversigt

| Kommando (Ctrl+Shift+P) | Gør |
|---|---|
| IBM i Bridge: Pull member(s) til workspace (til AI) | Spørger `LIB/KILDEFIL[/MEMBER]`, spejler det |
| Pull til workspace (til AI) *(kontekstmenu)* | Samme, fra højreklik i Object Browser |
| IBM i Bridge: Kompilér aktuel fil på IBM i | Gem + upload + korrekt CRT-kommando |
| IBM i Bridge: Upload aktuel fil til IBM i | Manuel upload; også diagnose |
| IBM i Bridge: Hent aktuel fil igen | Genhenter memberet og overskriver den lokale fil |
| IBM i Bridge: Åbn vejledning | Åbner denne vejledning i en Markdown-preview-fane — findes også i højreklik-menuen i Extensions-listen og i statuslinjens tooltip |

Compile vælger kommando ud fra filendelsen: RPGLE→CRTBNDRPG,
SQLRPGLE→CRTSQLRPGI, RPG→CRTRPGPGM, CLLE→CRTBNDCL, CLP/CL→CRTCLPGM,
CMD→CRTCMD, SQL→RUNSQLSTM, PF/LF/DSPF/PRTF→CRTPF/CRTLF/CRTDSPF/CRTPRTF.

### Sådan afvikles en compile

**Kompilér aktuel fil** gør fire ting i rækkefølge: filen gemmes → den uploades
til memberet (med forbindelses- og konflikttjek) → den rigtige CRT-kommando
køres på IBM i'en med forbindelsens biblioteksliste → resultatet vises i
panelet "IBM i Bridge" *og* skrives til `.compile/last.txt`. Ved succes viser
statuslinjen ✔; ved fejl står compilerens meddelelser i panelet. Objektet
oprettes i biblioteket fra **Target Library** — er den tom, spørges du hver
gang.

### AI-løkken

Med en agent i workspacet behøver du sjældent paletten: bed den *"ret fejlen og
kompilér"*. Den redigerer, broen uploader, compilen kører — og fordi resultatet
lander i `.compile/last.txt`, læser agenten selv fejlene og retter igen, indtil
den består.

### Når standardkommandoen ikke er nok

To alternativer: kør **Upload aktuel fil** efterfulgt af din egen CL-kommando
gennem Code for IBM i, eller — for fuld kontrol over parametre (TGTRLS, OPTION,
…) og klikbare fejl i Problems-panelet — brug Code for IBM i's egne **Actions**
på memberet i Object Browser. Broen har allerede uploadet din version, så
Actions kompilerer præcis det du ser.

## 7. Indstillinger

| Indstilling | Standard | Betydning |
|---|---|---|
| `bridgeForI.targetLibrary` | *(tom)* | Bibliotek der kompileres til; der spørges hvis tom |
| `bridgeForI.mirrorFolder` | `ibmi` | Spejlmappens navn i hver workspace-mappe |
| `bridgeForI.autoUploadOnSave` | `true` | Automatisk upload ved ændring |
| `bridgeForI.conflictCheck` | `true` | Advar før overskrivning af et member der er ændret på systemet |

## 8. Fejlfinding

Alt starter i **View → Output → "IBM i Bridge"**.

| Symptom | Kig efter / årsag |
|---|---|
| Intet sker ved Ctrl+S | Siger første loglinje v0.9.1? Ældre versioner manglede gem-lytteren. |
| `(gem) AFVIST …: forkert dybde` | Stien skal være præcis `ibmi/LIB/KILDEFIL/NAVN.ext` — tre niveauer |
| `…ligger ikke under nogen ibmi/-mappe` | Filen er gemt udenfor spejlet, eller `mirrorFolder` afviger |
| `Code for IBM i er ikke forbundet` | Forbind først; broen genbruger den forbindelse |
| `…skrivebeskyttet (readonly)` | Code for IBM i's egen forbindelsesindstilling spærrer skrivning |
| `Upload blokeret: spejlet er knyttet til …` | Du har skiftet Code for IBM i-forbindelse. Skift tilbage, eller kør et pull for at knytte spejlet til den aktive forbindelse |
| Upload fejler på ny fil | Se loggen: ADDPFM-resultatet vises; tjek autorisation og 10-tegns-grænsen |
| Compile fejler | CL-fejlen står i panelet; tjek Target Library og biblioteksliste |
| Forkerte æ/ø/å | CCSID-problem på IBM i-siden (profil/kildefil på 65535) — ikke en bro-indstilling |

Kommandoen **Upload aktuel fil til IBM i** er både manuel nødudgang og hurtig
diagnose.

## 9. Begrænsninger og godt håndværk

- Den lokale fil er din eneste fortrydelsesmulighed — **brug git** i spejlmappen.
- Ændres memberet på systemet mens det er spejlet, advarer konfliktvagten før
  overskrivning - med mulighed for at *vise forskellene* (kan slås fra). Brug "Hent aktuel fil igen" til at genopfriske.
- Fixed-format RPG og DDS er kolonnefølsomme: bevar indrykning præcist, kun
  mellemrum, aldrig tabulatorer (de genererede CLAUDE.md/AGENTS.md siger det samme
  til agenterne).
- Multi-root workspaces understøttes; spejlet findes i alle workspace-mapper.
- Verificeret mod vscode-ibmi's kildekode (member-FileSystemProvider,
  runCommand, runSQL, træ-nodernes form), men din version af Code for IBM i kan
  afvige — højreklik-handleren leder defensivt og falder tilbage til at spørge.

## 10. Licens

MIT © 2026 Glenn Jarzomkowski (jarzom@gmail.com). Ikke tilknyttet eller
godkendt af IBM.
