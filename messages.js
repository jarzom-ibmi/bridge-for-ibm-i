// Claude Member Bridge - messages in English (default) and Danish.
// Selection happens in extension.js based on VS Code's display language.

const EN = {
  active: (v) => `Bridge for IBM i ${v} active.`,
  notConnectedLog: "REJECTED: Code for IBM i is not connected.",
  notConnectedMsg: "Code for IBM i is not connected. Connect first, then try again.",
  openFolderFirst: "Open a folder as workspace first.",
  noMembersFound: (spec) => `No members found in ${spec}.`,
  pullingTitle: (n, lib, srcf) => `Fetching ${n} member(s) from ${lib}/${srcf}`,
  pullError: (lib, srcf, m, e) => `ERROR pulling ${lib}/${srcf}(${m}): ${e}`,
  pulledLog: (n, total, dir) => `Pulled ${n}/${total} member(s) to ${dir}`,
  pulledInfo: (n, base, lib, srcf) => `${n} member(s) ready for the AI agent in ${base}/${lib}/${srcf}`,
  outsideMirror: (src, p) => `(${src}) ${p}: outside the mirror folder - ignored`,
  unchangedSkip: (src, lib, srcf, mbr) => `(${src}) ${lib}/${srcf}(${mbr}): unchanged - skipping`,
  nameTooLong: (mbr) => `Member name "${mbr}" exceeds 10 characters and cannot be uploaded.`,
  uploading: (src, lib, srcf, mbr) => `(${src}) uploading ${lib}/${srcf}(${mbr}) ...`,
  readonlyLog: "REJECTED: the connection is in Code for IBM i's read-only mode.",
  readonlyMsg: "The Code for IBM i connection is in read-only mode - upload is blocked.",
  writeFailedRetry: (m) => `writeFile failed (${m}) - trying ADDPFM and retrying`,
  addpfmFailed: (d) => `ADDPFM failed: ${d}`,
  uploadFailed: (lib, srcf, mbr, m) => `Upload of ${lib}/${srcf}(${mbr}) failed: ${m}`,
  uploadFailedAfterCreate: (lib, srcf, mbr) => `Upload of ${lib}/${srcf}(${mbr}) failed after member creation.`,
  uploadedOk: (lib, srcf, mbr) => `OK: ${lib}/${srcf}(${mbr}) uploaded`,
  statusUploaded: (lib, srcf, mbr) => `⬆ ${lib}/${srcf}(${mbr})`,
  notInMirrorWarn: "The active file is not inside the mirror folder.",
  promptTargetLib: "Target library for compile",
  unknownExt: (ext) => `Don't know how to compile .${ext}. Use Code for IBM i's own Actions.`,
  compiledOkLog: (tgt, mbr) => `OK: ${tgt}/${mbr} created.`,
  statusCompiled: (tgt, mbr) => `✔ ${tgt}/${mbr} compiled`,
  compileFailed: (mbr) => `Compile of ${mbr} failed - see the "IBM i Bridge" output.`,
  watcherSelfWrite: (name) => `(watcher) ${name}: own pull write - ignored`,
  watcherError: (p, e) => `Watcher error for ${p}: ${e}`,
  watching: (dir) => `Watching ${dir} (including writes made outside the editor, e.g. by AI agents).`,
  noWorkspaceWatcher: "No workspace folder open - the watcher is waiting.",
  pullPrompt: "What should be fetched? LIBRARY/SOURCEFILE, LIBRARY/SOURCEFILE/MEMBER or LIBRARY/SOURCEFILE/ORD* (wildcard)",
  pullPlaceholder: "MYLIB/QRPGLESRC",
  pullFormatError: "Use the format LIBRARY/SOURCEFILE[/MEMBER].",
  saveRejected: (name, reason) => `(save) REJECTED ${name}: ${reason}`,
  saveEvent: (name) => `(save) Ctrl+S on ${name}`,
  saveError: (e) => `Save error: ${e}`,
  reasonNoWorkspace: "no workspace folder is open",
  reasonWrongDepth: (n, mirror) =>
    `wrong depth (${n} level(s) below ${mirror}/ - must be exactly 3: LIBRARY/SOURCEFILE/NAME.ext)`,
  reasonMissingExt: "the file has no extension (.rpgle, .rpg, .clle ...)",
  reasonNotUnderMirror: (mirror) => `not located under any ${mirror}/ folder in the workspace`,
  conflictMsg: (lib, srcf, mbr, when) =>
    `${lib}/${srcf}(${mbr}) was changed on the IBM i (${when}) after your last pull/upload. Overwrite the member with your local version?`,
  btnOverwrite: "Overwrite member",
  conflictCancelled: (lib, srcf, mbr) => `Upload of ${lib}/${srcf}(${mbr}) cancelled - member changed on the host`,
  conflictCheckFailed: (e) => `Conflict check failed (${e}) - proceeding with upload`,
  rePulled: (lib, srcf, mbr) => `Re-pulled ${lib}/${srcf}(${mbr}) - local file overwritten`,
  rePullFailed: (e) => `Re-pull failed: ${e}`,
  manualOpenFallback: (e) => `Markdown preview unavailable (${e}) - opening the manual (README.md) as text`,
  btnDiff: "Show differences",
  diffTitle: (lib, srcf, mbr) => `${lib}/${srcf}(${mbr}): IBM i \u2194 local`,
  conflictDiffOpened: (lib, srcf, mbr) => `Diff opened for ${lib}/${srcf}(${mbr}) - upload cancelled; save again to retry`,
  btnRebind: (name) => `Rebind mirror to ${name}`,
  connMismatchPull: (bound, active) => `This mirror is bound to the connection "${bound}", but you are connected to "${active}". Rebind the mirror to "${active}"?`,
  connMismatchUpload: (bound, active) => `Upload blocked: the mirror is bound to "${bound}", but the active connection is "${active}". Switch connection, or pull to rebind.`,
  connBound: (name) => `Mirror bound to connection "${name}"`,
  statusOk: (name) => `$(plug) Bridge: ${name}`,
  statusMismatch: (active) => `$(warning) Bridge: ${active}`,
  statusNoConn: `$(debug-disconnected) Bridge: not connected`,
  tipOk: (name) => `Bridge for IBM i - uploads go to "${name}"`,
  tipMismatch: (active, bound) => `Bridge for IBM i - WARNING: connected to "${active}" but the mirror is bound to "${bound}". Uploads are blocked.`,
  tipNoConn: "Bridge for IBM i - Code for IBM i is not connected",
  tipManual: "Open manual",
  tipOutput: "Show output",
  compileResultWritten: (p) => `Compile result written to ${p}`,
  agentsMd: `# IBM i source members (mirrored via Bridge for IBM i)

The files in this folder are local copies of source members on an IBM i.
The path layout is ibmi/LIBRARY/SOURCEFILE/MEMBER.type. These instructions
apply to any AI agent or tool editing files here.

- Edit the files directly. When a file changes on disk it is uploaded to the
  IBM i automatically by the bridge - do not run ssh or copy anything yourself.
- After a change: ask the user to run "IBM i Bridge: Compile current file",
  or suggest the command yourself, and show the compile result.
- Member names are at most 10 characters. New files must follow the folder
  layout exactly, otherwise they cannot be uploaded.
- Fixed-format RPG and DDS are column-sensitive - preserve indentation
  precisely, and use spaces, never tabs.
- After each compile the full result is written to .compile/last.txt in this
  folder - read it to see the errors, then fix them and compile again.
- There is no version control on the member itself; the local file is the only
  undo. Consider using git in this folder.
`,
  claudeMd: `# IBM i source members (mirrored via Bridge for IBM i)

The files in this folder are local copies of source members on an IBM i.
The path layout is ibmi/LIBRARY/SOURCEFILE/MEMBER.type.

- Edit the files directly. When a file changes on disk it is uploaded to the
  IBM i automatically by the bridge - do not run ssh or copy anything yourself.
- After a change: ask the user to run "IBM i Bridge: Compile current file",
  or suggest the command yourself, and show the compile result.
- Member names are at most 10 characters. New files must follow the folder
  layout exactly, otherwise they cannot be uploaded.
- Fixed-format RPG and DDS are column-sensitive - preserve indentation
  precisely, and use spaces, never tabs.
- After each compile the full result is written to .compile/last.txt in this
  folder - read it to see the errors, then fix them and compile again.
- There is no version control on the member itself; the local file is the only
  undo. Consider using git in this folder.
`,
};

const DA = {
  active: (v) => `Bridge for IBM i ${v} aktiv.`,
  notConnectedLog: "AFVIST: Code for IBM i er ikke forbundet.",
  notConnectedMsg: "Code for IBM i er ikke forbundet. Forbind først, og prøv igen.",
  openFolderFirst: "Åbn en mappe som workspace først.",
  noMembersFound: (spec) => `Ingen members fundet i ${spec}.`,
  pullingTitle: (n, lib, srcf) => `Henter ${n} member(s) fra ${lib}/${srcf}`,
  pullError: (lib, srcf, m, e) => `FEJL ved pull af ${lib}/${srcf}(${m}): ${e}`,
  pulledLog: (n, total, dir) => `Hentede ${n}/${total} member(s) til ${dir}`,
  pulledInfo: (n, base, lib, srcf) => `${n} member(s) klar til AI-agenten i ${base}/${lib}/${srcf}`,
  outsideMirror: (src, p) => `(${src}) ${p}: udenfor spejlmappen - ignoreret`,
  unchangedSkip: (src, lib, srcf, mbr) => `(${src}) ${lib}/${srcf}(${mbr}): uændret - springer over`,
  nameTooLong: (mbr) => `Membernavnet "${mbr}" er over 10 tegn og kan ikke uploades.`,
  uploading: (src, lib, srcf, mbr) => `(${src}) uploader ${lib}/${srcf}(${mbr}) ...`,
  readonlyLog: "AFVIST: forbindelsen er skrivebeskyttet (readonly) i Code for IBM i.",
  readonlyMsg: "Code for IBM i-forbindelsen er skrivebeskyttet (readonly) - upload er spærret.",
  writeFailedRetry: (m) => `writeFile fejlede (${m}) - opretter memberet med ADDPFM og forsøger igen`,
  addpfmFailed: (d) => `ADDPFM fejlede: ${d}`,
  uploadFailed: (lib, srcf, mbr, m) => `Upload af ${lib}/${srcf}(${mbr}) fejlede: ${m}`,
  uploadFailedAfterCreate: (lib, srcf, mbr) => `Upload af ${lib}/${srcf}(${mbr}) fejlede efter oprettelse af memberet.`,
  uploadedOk: (lib, srcf, mbr) => `OK: ${lib}/${srcf}(${mbr}) uploadet`,
  statusUploaded: (lib, srcf, mbr) => `⬆ ${lib}/${srcf}(${mbr})`,
  notInMirrorWarn: "Den aktive fil ligger ikke i spejlmappen.",
  promptTargetLib: "Målbibliotek til compile",
  unknownExt: (ext) => `Kender ikke en compile-kommando til .${ext}. Brug Code for IBM i's egne Actions.`,
  compiledOkLog: (tgt, mbr) => `OK: ${tgt}/${mbr} oprettet.`,
  statusCompiled: (tgt, mbr) => `✔ ${tgt}/${mbr} kompileret`,
  compileFailed: (mbr) => `Compile af ${mbr} fejlede - se outputpanelet "IBM i Bridge".`,
  watcherSelfWrite: (name) => `(watcher) ${name}: egen pull-skrivning - ignoreret`,
  watcherError: (p, e) => `Watcher-fejl for ${p}: ${e}`,
  watching: (dir) => `Overvåger ${dir} (også skrivninger uden om editoren, fx fra AI-agenter).`,
  noWorkspaceWatcher: "Ingen workspace-mappe åben - watcheren venter.",
  pullPrompt: "Hvad skal hentes? BIBLIOTEK/KILDEFIL, BIBLIOTEK/KILDEFIL/MEMBER eller BIBLIOTEK/KILDEFIL/ORD* (wildcard)",
  pullPlaceholder: "MINLIB/QRPGLESRC",
  pullFormatError: "Brug formatet BIBLIOTEK/KILDEFIL[/MEMBER].",
  saveRejected: (name, reason) => `(gem) AFVIST ${name}: ${reason}`,
  saveEvent: (name) => `(gem) Ctrl+S på ${name}`,
  saveError: (e) => `Gem-fejl: ${e}`,
  reasonNoWorkspace: "ingen workspace-mappe er åben",
  reasonWrongDepth: (n, mirror) =>
    `forkert dybde (${n} niveau(er) under ${mirror}/ - skal være præcis 3: BIBLIOTEK/KILDEFIL/NAVN.ext)`,
  reasonMissingExt: "filen mangler en filendelse (.rpgle, .rpg, .clle ...)",
  reasonNotUnderMirror: (mirror) => `ligger ikke under nogen ${mirror}/-mappe i workspacet`,
  conflictMsg: (lib, srcf, mbr, when) =>
    `${lib}/${srcf}(${mbr}) er ændret på IBM i'en (${when}) efter dit seneste pull/upload. Overskriv memberet med din lokale version?`,
  btnOverwrite: "Overskriv member",
  conflictCancelled: (lib, srcf, mbr) => `Upload af ${lib}/${srcf}(${mbr}) annulleret - memberet er ændret på systemet`,
  conflictCheckFailed: (e) => `Konflikttjek fejlede (${e}) - fortsætter med upload`,
  rePulled: (lib, srcf, mbr) => `Hentede ${lib}/${srcf}(${mbr}) igen - den lokale fil er overskrevet`,
  rePullFailed: (e) => `Genhentning fejlede: ${e}`,
  manualOpenFallback: (e) => `Markdown-preview utilgængelig (${e}) - åbner vejledningen (README.md) som tekst`,
  btnDiff: "Vis forskelle",
  diffTitle: (lib, srcf, mbr) => `${lib}/${srcf}(${mbr}): IBM i \u2194 lokal`,
  conflictDiffOpened: (lib, srcf, mbr) => `Diff åbnet for ${lib}/${srcf}(${mbr}) - upload annulleret; gem igen for at prøve på ny`,
  btnRebind: (name) => `Knyt spejlet til ${name}`,
  connMismatchPull: (bound, active) => `Dette spejl er knyttet til forbindelsen "${bound}", men du er forbundet til "${active}". Knyt spejlet til "${active}" i stedet?`,
  connMismatchUpload: (bound, active) => `Upload blokeret: spejlet er knyttet til "${bound}", men den aktive forbindelse er "${active}". Skift forbindelse, eller kør et nyt pull for at knytte spejlet til den aktive.`,
  connBound: (name) => `Spejlet er knyttet til forbindelsen "${name}"`,
  statusOk: (name) => `$(plug) Bridge: ${name}`,
  statusMismatch: (active) => `$(warning) Bridge: ${active}`,
  statusNoConn: `$(debug-disconnected) Bridge: ikke forbundet`,
  tipOk: (name) => `Bridge for IBM i - uploads går til "${name}"`,
  tipMismatch: (active, bound) => `Bridge for IBM i - ADVARSEL: forbundet til "${active}", men spejlet er knyttet til "${bound}". Uploads er blokeret.`,
  tipNoConn: "Bridge for IBM i - Code for IBM i er ikke forbundet",
  tipManual: "Åbn vejledning",
  tipOutput: "Vis output",
  compileResultWritten: (p) => `Compile-resultat skrevet til ${p}`,
  agentsMd: `# IBM i source members (spejlet via Bridge for IBM i)

Filerne i denne mappe er lokale kopier af source members på en IBM i.
Stien er ibmi/BIBLIOTEK/KILDEFIL/MEMBER.type. Disse instruktioner gælder for
enhver AI-agent eller ethvert værktøj, der redigerer filer her.

- Rediger filerne direkte. Når en fil ændres på disken, uploades den automatisk
  til IBM i'en af broen - du skal ikke selv bruge ssh eller kopiere noget.
- Efter en ændring: bed brugeren køre "IBM i Bridge: Kompilér aktuel fil",
  eller foreslå selv kommandoen, og vis compile-resultatet.
- Membernavne må højst være 10 tegn. Nye filer skal følge mappestrukturen
  præcist, ellers kan de ikke uploades.
- Fixed-format RPG og DDS er kolonnefølsomme - bevar indrykning præcist, og
  brug mellemrum, aldrig tabulatorer.
- Efter hver compile skrives det fulde resultat til .compile/last.txt i denne
  mappe - læs den for at se fejlene, ret dem, og kompilér igen.
- Der er ingen versionsstyring på selve memberet; den lokale fil er din eneste
  fortrydelsesmulighed. Overvej git i denne mappe.
`,
  claudeMd: `# IBM i source members (spejlet via Bridge for IBM i)

Filerne i denne mappe er lokale kopier af source members på en IBM i.
Stien er ibmi/BIBLIOTEK/KILDEFIL/MEMBER.type.

- Rediger filerne direkte. Når en fil ændres på disken, uploades den automatisk
  til IBM i'en af broen - du skal ikke selv bruge ssh eller kopiere noget.
- Efter en ændring: bed brugeren køre "IBM i Bridge: Kompilér aktuel fil",
  eller foreslå selv kommandoen, og vis compile-resultatet.
- Membernavne må højst være 10 tegn. Nye filer skal følge mappestrukturen
  præcist, ellers kan de ikke uploades.
- Fixed-format RPG og DDS er kolonnefølsomme - bevar indrykning præcist, og
  brug mellemrum, aldrig tabulatorer.
- Efter hver compile skrives det fulde resultat til .compile/last.txt i denne
  mappe - læs den for at se fejlene, ret dem, og kompilér igen.
- Der er ingen versionsstyring på selve memberet; den lokale fil er din eneste
  fortrydelsesmulighed. Overvej git i denne mappe.
`,
};

module.exports = { EN, DA };
