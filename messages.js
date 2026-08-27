// Claude Member Bridge - messages in English (default) and Danish.
// Selection happens in extension.js based on VS Code's display language.

const EN = {
  active: (v) => `Bridge for IBM i ${v} active.`,
  notConnectedLog: "REJECTED: Code for IBM i is not connected.",
  notConnectedMsg: "Code for IBM i is not connected. Connect first, then try again.",
  openFolderFirst: "Open a folder as workspace first.",
  noMembersFound: (spec) => `No members found in ${spec}.`,
  pullingTitle: (lib, srcf) => `Fetching members from ${lib}/${srcf}`,
  pullingLibTitle: (n, lib) => `Fetching ${n} source file(s) from library ${lib}`,
  pullLibInvoked: (lib) => `(pull) whole library ${lib} requested`,
  pullLibFound: (n, lib) => `(pull) ${n} source file(s) found in ${lib}`,
  pullLibConfirm: (n, lib, conn) => `Pull all ${n} source file(s) in ${lib} with every member from "${conn}"? Local files in the mirror are overwritten.`,
  btnPullAll: "Pull all",
  pullLibCancelled: "(pull) library pull cancelled by the user",
  pullLibInfo: (lib, f, ft, m, mt, base) => `${lib}: ${m}/${mt} member(s) in ${f}/${ft} source file(s) ready for the AI agent in ${base}/${lib}`,
  pullLibPrompt: "Which library should be fetched completely (all source files, all members)?",
  noSourceFiles: (lib) => `No source files found in ${lib}.`,
  srcfListSqlFailed: (e) => `Source file list via SQL failed (${e}) - using Code for IBM i's object list instead`,
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
  pullPrompt: "What should be fetched? LIBRARY (everything), LIBRARY/SOURCEFILE, LIBRARY/SOURCEFILE/MEMBER or LIBRARY/SOURCEFILE/ORD* (wildcard)",
  pullPlaceholder: "MYLIB/QRPGLESRC",
  pullFormatError: "Use the format LIBRARY (whole library), LIBRARY/SOURCEFILE or LIBRARY/SOURCEFILE/MEMBER.",
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
  dirNotInMirror: (mirror) => `That folder is not inside the ${mirror}/ mirror (expected ${mirror}/, ${mirror}/LIBRARY or ${mirror}/LIBRARY/SOURCEFILE).`,
  noLocalFiles: (scope) => `No member files found locally under ${scope}.`,
  uploadDirConfirm: (n, scope, conn) => `Upload ${n} file(s) from ${scope} to the IBM i "${conn}"? Members are overwritten with the local files; missing members are created.`,
  btnUploadAll: "Upload all",
  uploadingTitle: (n, scope) => `Uploading ${n} file(s) from ${scope}`,
  uploadDirPrompt: "What should be uploaded? LIBRARY/SOURCEFILE or LIBRARY (all source files)",
  uploadDirFormatError: "Use the format LIBRARY/SOURCEFILE or LIBRARY.",
  btnOverwriteAll: "Overwrite all",
  btnSkip: "Skip",
  btnSkipAll: "Skip all",
  bulkCancelled: "Folder upload cancelled by the user - remaining files were not uploaded.",
  uploadDirFileError: (rel, e) => `ERROR uploading ${rel}: ${e}`,
  uploadDirLog: (scope, ok, same, bad, total) => `Folder upload ${scope}: ${ok} uploaded, ${same} unchanged, ${bad} failed/skipped (of ${total})`,
  uploadDirInfo: (scope, ok, same, bad) => `${scope}: ${ok} uploaded, ${same} unchanged${bad ? `, ${bad} failed/skipped` : ""}`,
  btnShowOutput: "Show output",
  uploadFolderInvoked: (what) => `(folder) upload requested for: ${what}`,
  uploadDirStart: (p, force) => `(folder) scanning ${p}${force ? " (force: unchanged files too)" : ""}`,
  uploadDirFound: (n, scope) => `(folder) ${n} local file(s) found under ${scope}`,
  uploadDirDeclined: "(folder) upload declined by the user",
  uploadDirAllUnchanged: (scope, n) => `${scope}: nothing uploaded - all ${n} file(s) are unchanged since the last pull/upload.`,
  btnUploadAnyway: "Upload all anyway",
  pullNodeInvoked: (what) => `(pull) requested for ${what}`,
  guardBlocked: (kind, text) => `GUARD: refused ${kind} - Bridge for IBM i never deletes, clears, renames or moves anything on the IBM i. Blocked: ${text}`,
  pullFailed: (e) => `Pull failed: ${e}`,
  memberListSqlFailed: (e) => `Member list via SQL failed (${e}) - using Code for IBM i's member list instead`,
  agentsMd: `# IBM i source members (mirrored via Bridge for IBM i)

The files in this folder are local copies of source members on an IBM i.
The path layout is ibmi/LIBRARY/SOURCEFILE/MEMBER.type. These instructions
apply to any AI agent or tool editing files here.

- Edit the files directly. When a file changes on disk it is uploaded to the
  IBM i automatically by the bridge - do not run ssh or copy anything yourself.
  If many files were changed, the user can also upload a whole folder with
  "IBM i Bridge: Upload folder to IBM i (all members)".
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
  If many files were changed, the user can also upload a whole folder with
  "IBM i Bridge: Upload folder to IBM i (all members)".
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
  pullingTitle: (lib, srcf) => `Henter members fra ${lib}/${srcf}`,
  pullingLibTitle: (n, lib) => `Henter ${n} kildefil(er) fra biblioteket ${lib}`,
  pullLibInvoked: (lib) => `(pull) hele biblioteket ${lib} bedt om`,
  pullLibFound: (n, lib) => `(pull) ${n} kildefil(er) fundet i ${lib}`,
  pullLibConfirm: (n, lib, conn) => `Hent alle ${n} kildefil(er) i ${lib} med samtlige members fra "${conn}"? Lokale filer i spejlet overskrives.`,
  btnPullAll: "Hent alle",
  pullLibCancelled: "(pull) hentning af biblioteket afbrudt af brugeren",
  pullLibInfo: (lib, f, ft, m, mt, base) => `${lib}: ${m}/${mt} member(s) i ${f}/${ft} kildefil(er) klar til AI-agenten i ${base}/${lib}`,
  pullLibPrompt: "Hvilket bibliotek skal hentes komplet (alle kildefiler, alle members)?",
  noSourceFiles: (lib) => `Ingen kildefiler fundet i ${lib}.`,
  srcfListSqlFailed: (e) => `Kildefil-liste via SQL fejlede (${e}) - bruger Code for IBM i's objektliste i stedet`,
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
  pullPrompt: "Hvad skal hentes? BIBLIOTEK (alt), BIBLIOTEK/KILDEFIL, BIBLIOTEK/KILDEFIL/MEMBER eller BIBLIOTEK/KILDEFIL/ORD* (wildcard)",
  pullPlaceholder: "MINLIB/QRPGLESRC",
  pullFormatError: "Brug formatet BIBLIOTEK (hele biblioteket), BIBLIOTEK/KILDEFIL eller BIBLIOTEK/KILDEFIL/MEMBER.",
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
  dirNotInMirror: (mirror) => `Den mappe ligger ikke i ${mirror}/-spejlet (forventet ${mirror}/, ${mirror}/BIBLIOTEK eller ${mirror}/BIBLIOTEK/KILDEFIL).`,
  noLocalFiles: (scope) => `Ingen member-filer fundet lokalt under ${scope}.`,
  uploadDirConfirm: (n, scope, conn) => `Upload ${n} fil(er) fra ${scope} til IBM i'en "${conn}"? Members overskrives med de lokale filer; manglende members oprettes.`,
  btnUploadAll: "Upload alle",
  uploadingTitle: (n, scope) => `Uploader ${n} fil(er) fra ${scope}`,
  uploadDirPrompt: "Hvad skal uploades? BIBLIOTEK/KILDEFIL eller BIBLIOTEK (alle kildefiler)",
  uploadDirFormatError: "Brug formatet BIBLIOTEK/KILDEFIL eller BIBLIOTEK.",
  btnOverwriteAll: "Overskriv alle",
  btnSkip: "Spring over",
  btnSkipAll: "Spring alle over",
  bulkCancelled: "Mappe-upload afbrudt af brugeren - de resterende filer blev ikke uploadet.",
  uploadDirFileError: (rel, e) => `FEJL ved upload af ${rel}: ${e}`,
  uploadDirLog: (scope, ok, same, bad, total) => `Mappe-upload ${scope}: ${ok} uploadet, ${same} uændret, ${bad} fejlet/sprunget over (af ${total})`,
  uploadDirInfo: (scope, ok, same, bad) => `${scope}: ${ok} uploadet, ${same} uændret${bad ? `, ${bad} fejlet/sprunget over` : ""}`,
  btnShowOutput: "Vis output",
  uploadFolderInvoked: (what) => `(mappe) upload bedt om for: ${what}`,
  uploadDirStart: (p, force) => `(mappe) gennemgår ${p}${force ? " (force: også uændrede filer)" : ""}`,
  uploadDirFound: (n, scope) => `(mappe) ${n} lokal(e) fil(er) fundet under ${scope}`,
  uploadDirDeclined: "(mappe) upload afvist af brugeren",
  uploadDirAllUnchanged: (scope, n) => `${scope}: intet uploadet - alle ${n} fil(er) er uændrede siden seneste pull/upload.`,
  btnUploadAnyway: "Upload alle alligevel",
  pullNodeInvoked: (what) => `(pull) bedt om for ${what}`,
  guardBlocked: (kind, text) => `VAGT: afviste ${kind} - Bridge for IBM i sletter, tømmer, omdøber eller flytter aldrig noget på IBM i'en. Blokeret: ${text}`,
  pullFailed: (e) => `Pull fejlede: ${e}`,
  memberListSqlFailed: (e) => `Member-liste via SQL fejlede (${e}) - bruger Code for IBM i's egen member-liste i stedet`,
  agentsMd: `# IBM i source members (spejlet via Bridge for IBM i)

Filerne i denne mappe er lokale kopier af source members på en IBM i.
Stien er ibmi/BIBLIOTEK/KILDEFIL/MEMBER.type. Disse instruktioner gælder for
enhver AI-agent eller ethvert værktøj, der redigerer filer her.

- Rediger filerne direkte. Når en fil ændres på disken, uploades den automatisk
  til IBM i'en af broen - du skal ikke selv bruge ssh eller kopiere noget.
  Er mange filer ændret, kan brugeren også uploade en hel mappe med
  "IBM i Bridge: Upload mappe til IBM i (alle members)".
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
  Er mange filer ændret, kan brugeren også uploade en hel mappe med
  "IBM i Bridge: Upload mappe til IBM i (alle members)".
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
