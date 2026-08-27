// Bridge for i
// Rider piggyback paa Code for IBM i: samme forbindelse, samme CCSID-haandtering,
// samme member-filsystem. Spejler members som lokale filer, som Claude Code kan
// laese og redigere.
//
// Upload sker ad TO veje, som begge ender i samme uploadFile med hash-vagt:
//   1) onDidSaveTextDocument  - naar DU gemmer i editoren (Ctrl+S). Paalidelig.
//   2) FileSystemWatcher      - naar CLAUDE CODE skriver direkte paa disken.
// Alt logges i outputpanelet "IBM i Bridge", saa fejl kan stedfaestes.

const vscode = require("vscode");
const path = require("path");
const { EN, DA } = require("./messages");

// English is the default; Danish when VS Code's display language is Danish.
const L = String(vscode.env.language || "en").toLowerCase().startsWith("da") ? DA : EN;

let out; // output channel

// Indstillinger: laes bridgeForI.*, men fald tilbage til de gamle
// claudeMemberBridge.*-noegler, saa eksisterende opsaetning overlever omdoebningen.
function cfg(key, def) {
  const ni = vscode.workspace.getConfiguration("bridgeForI").inspect(key);
  const hasNew = ni && (ni.globalValue !== undefined ||
                        ni.workspaceValue !== undefined ||
                        ni.workspaceFolderValue !== undefined);
  if (hasNew) return vscode.workspace.getConfiguration("bridgeForI").get(key, def);
  return vscode.workspace.getConfiguration("claudeMemberBridge").get(key, def);
}
let extContext; // til workspaceState

// Baseline: memberets ændringstidspunkt ved seneste pull/upload, pr. lokal sti.
// Persisteres, så konfliktvagten også virker efter genstart af VS Code.
let baselines = {};
function saveBaseline(fsPath, ts) {
  if (ts) baselines[fsPath] = ts; else delete baselines[fsPath];
  extContext && extContext.workspaceState.update("ibmiBridge.baselines", baselines);
}

function connName(conn) {
  return (
    conn.currentConnectionName ||
    `${conn.currentUser || "?"}@${conn.currentHost || "?"}`
  );
}

// Manifest pr. spejlrod (.bridge.json): hvilken forbindelse hoerer spejlet til.
async function readManifest(root) {
  try {
    const b = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(root, ".bridge.json"));
    return JSON.parse(Buffer.from(b).toString("utf8")) || {};
  } catch {
    return {};
  }
}
async function writeManifest(root, man) {
  await vscode.workspace.fs.writeFile(
    vscode.Uri.joinPath(root, ".bridge.json"),
    Buffer.from(JSON.stringify(man, null, 2) + "\n", "utf8")
  );
}

// Blokerende bindingstjek foer upload/genhentning. Fail-open ved laesefejl.
async function checkBinding(root, conn) {
  try {
    const man = await readManifest(root);
    const active = connName(conn);
    if (man.connection && man.connection !== active) {
      const msg = L.connMismatchUpload(man.connection, active);
      log(msg);
      vscode.window.showErrorMessage(msg);
      refreshStatusBar();
      return false;
    }
  } catch { /* manifestet er en sikring, ikke et krav */ }
  return true;
}

async function memberTimestamp(conn, lib, srcf, mbr) {
  const rows = await conn.runSQL(
    `select coalesce(char(LAST_SOURCE_UPDATE_TIMESTAMP), '') as TS
     from QSYS2.SYSPARTITIONSTAT
     where SYSTEM_TABLE_SCHEMA = '${lib.replace(/'/g, "''")}'
       and SYSTEM_TABLE_NAME  = '${srcf.replace(/'/g, "''")}'
       and SYSTEM_TABLE_MEMBER = '${mbr.replace(/'/g, "''")}'`
  );
  return rows.length ? String(rows[0].TS || "").trim() : "";
}

// Filer broen selv skriver under pull - watcher-haendelser for dem ignoreres.
const selfWrites = new Set();
// Sidst uploadede indholds-hash pr. sti - uaendret indhold uploades ikke igen.
// Persisteres, saa en genstart af VS Code ikke udloeser en overfloedig upload
// (som ville flytte memberets aendringstidspunkt).
const lastUpload = new Map();
function saveHash(fsPath, h) {
  lastUpload.set(fsPath, h);
  extContext && extContext.workspaceState.update(
    "ibmiBridge.hashes",
    Object.fromEntries(lastUpload)
  );
}
// Debounce-timere pr. sti (kun watcher-vejen).
const pending = new Map();

function log(msg) {
  out.appendLine(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

function contentHash(bytes) {
  let h = 5381;
  for (let i = 0; i < bytes.length; i++) h = ((h * 33) ^ bytes[i]) >>> 0;
  return h + ":" + bytes.length;
}

// ---------------------------------------------------------------- hjaelpere
function getInstance() {
  const base = vscode.extensions.getExtension("halcyontechltd.code-for-ibmi");
  if (!base || !base.isActive || !base.exports) return undefined;
  return base.exports.instance;
}

function requireConnection() {
  const instance = getInstance();
  const conn = instance && instance.getConnection();
  if (!conn) {
    log(L.notConnectedLog);
    vscode.window.showErrorMessage(L.notConnectedMsg);
    return undefined;
  }
  return { instance, conn };
}

function mirrorFolderName() {
  return cfg("mirrorFolder", "ibmi");
}

// Alle spejlrødder - én pr. workspace-mappe (multi-root understøttes nu)
function mirrorRoots() {
  const ws = vscode.workspace.workspaceFolders || [];
  const folder = mirrorFolderName();
  return ws.map((w) => vscode.Uri.joinPath(w.uri, folder));
}

// Første spejlrod - bruges af pull og CLAUDE.md
function mirrorRoot() {
  return mirrorRoots()[0];
}

function memberUri(lib, srcf, mbr, ext) {
  return vscode.Uri.from({
    scheme: "member",
    path: `/${lib}/${srcf}/${mbr}.${ext}`,
  });
}

function up(s) {
  return String(s || "").toUpperCase().trim();
}

// Lokal spejlsti -> memberkoordinater, med forklaring ved afslag.
function explainMirrorPath(fileUri) {
  const roots = mirrorRoots();
  if (!roots.length) return { reason: L.reasonNoWorkspace };
  for (const root of roots) {
    const rel = path.relative(root.fsPath, fileUri.fsPath);
    if (rel.startsWith("..") || path.isAbsolute(rel)) continue; // ikke denne rod
    const parts = rel.split(path.sep);
    if (parts.length !== 3)
      return { reason: L.reasonWrongDepth(parts.length, mirrorFolderName()) };
    const [lib, srcf, filename] = parts;
    const dot = filename.lastIndexOf(".");
    if (dot < 1) return { reason: L.reasonMissingExt };
    return {
      coords: {
        lib: up(lib),
        srcf: up(srcf),
        mbr: up(filename.slice(0, dot)),
        ext: filename.slice(dot + 1).toLowerCase(),
        root,
      },
    };
  }
  return { reason: L.reasonNotUnderMirror(mirrorFolderName()) };
}

function parseMirrorPath(fileUri) {
  return explainMirrorPath(fileUri).coords;
}

// Lokal MAPPE i spejlet -> { root, lib?, srcf? }. Dybden afgoer omfanget:
// roden = hele spejlet, LIB = alle kildefiler, LIB/KILDEFIL = én kildefil.
function explainMirrorDir(dirUri) {
  for (const root of mirrorRoots()) {
    const rel = path.relative(root.fsPath, dirUri.fsPath);
    if (rel.startsWith("..") || path.isAbsolute(rel)) continue;
    const parts = rel.split(path.sep).filter(Boolean);
    if (parts.length > 2) return undefined;
    if (parts.some((p) => p.startsWith("."))) return undefined;
    return { root, lib: parts[0] && up(parts[0]), srcf: parts[1] && up(parts[1]) };
  }
  return undefined;
}

// Alle member-filer under <root>/[lib]/[srcf] - kun praecis 3 niveauer dybt,
// skjulte navne (.compile, .bridge.json, .git ...) springes over.
async function collectMirrorFiles(root, lib, srcf) {
  const files = [];
  const isFile = (t) => (t & vscode.FileType.File) !== 0;
  const isDir = (t) => (t & vscode.FileType.Directory) !== 0;
  const listDirs = async (uri) => {
    let entries = [];
    try { entries = await vscode.workspace.fs.readDirectory(uri); } catch { /* mangler */ }
    return entries.filter(([n, t]) => isDir(t) && !n.startsWith(".")).map(([n]) => n).sort();
  };
  const libs = lib ? [lib] : await listDirs(root);
  for (const l of libs) {
    const libUri = vscode.Uri.joinPath(root, l);
    const srcfs = srcf ? [srcf] : await listDirs(libUri);
    for (const s of srcfs) {
      const dir = vscode.Uri.joinPath(libUri, s);
      let entries = [];
      try { entries = await vscode.workspace.fs.readDirectory(dir); } catch { /* mangler */ }
      for (const [n, t] of entries.sort((a, b) => a[0].localeCompare(b[0]))) {
        if (!isFile(t) || n.startsWith(".") || n.lastIndexOf(".") < 1) continue;
        files.push(vscode.Uri.joinPath(dir, n));
      }
    }
  }
  return files;
}

async function membersOf(conn, lib, srcf, onlyMbr) {
  let cond = "";
  if (onlyMbr) {
    const pat = onlyMbr.replace(/\*/g, "%").replace(/'/g, "''");
    cond = pat.includes("%")
      ? `and SYSTEM_TABLE_MEMBER like '${pat}'`
      : `and SYSTEM_TABLE_MEMBER = '${pat}'`;
  }
  const rows = await conn.runSQL(
    `select SYSTEM_TABLE_MEMBER as M, coalesce(SOURCE_TYPE, 'TXT') as T,
            coalesce(char(LAST_SOURCE_UPDATE_TIMESTAMP), '') as TS
     from QSYS2.SYSPARTITIONSTAT
     where SYSTEM_TABLE_SCHEMA = '${lib.replace(/'/g, "''")}'
       and SYSTEM_TABLE_NAME  = '${srcf.replace(/'/g, "''")}'
       ${cond}
     order by 1`
  );
  return rows.map((r) => ({ name: up(r.M), type: up(r.T || "TXT"), ts: String(r.TS || "").trim() }));
}

// ---------------------------------------------------------------- pull
async function pullMembers(lib, srcf, onlyMbr) {
  const ctx = requireConnection();
  if (!ctx) return;
  const root = mirrorRoot();
  if (!root) {
    vscode.window.showErrorMessage(L.openFolderFirst);
    return;
  }

  const active = connName(ctx.conn);
  const man = await readManifest(root);
  if (man.connection && man.connection !== active) {
    const pick = await vscode.window.showWarningMessage(
      L.connMismatchPull(man.connection, active),
      { modal: true },
      L.btnRebind(active)
    );
    if (pick !== L.btnRebind(active)) return;
  }
  if (man.connection !== active) {
    man.connection = active;
    await writeManifest(root, man);
    log(L.connBound(active));
  }
  refreshStatusBar();

  lib = up(lib);
  srcf = up(srcf);
  const list = await membersOf(ctx.conn, lib, srcf, onlyMbr && up(onlyMbr));
  if (!list.length) {
    vscode.window.showWarningMessage(L.noMembersFound(`${lib}/${srcf}${onlyMbr ? `(${up(onlyMbr)})` : ""}`));
    return;
  }

  const dir = vscode.Uri.joinPath(root, lib, srcf);
  await vscode.workspace.fs.createDirectory(dir);

  let n = 0;
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: L.pullingTitle(list.length, lib, srcf),
    },
    async (progress) => {
      for (const m of list) {
        const ext = m.type.toLowerCase() || "txt";
        try {
          const bytes = await vscode.workspace.fs.readFile(
            memberUri(lib, srcf, m.name, ext)
          );
          const local = vscode.Uri.joinPath(dir, `${m.name}.${ext}`);
          selfWrites.add(local.fsPath);
          try {
            await vscode.workspace.fs.writeFile(local, bytes);
            saveHash(local.fsPath, contentHash(bytes));
            saveBaseline(local.fsPath, m.ts);
          } finally {
            setTimeout(() => selfWrites.delete(local.fsPath), 2500);
          }
          n++;
          progress.report({ message: m.name, increment: 100 / list.length });
        } catch (e) {
          log(L.pullError(lib, srcf, m.name, e.message || e));
        }
      }
    }
  );

  await ensureInstructionFiles(root);
  log(L.pulledLog(n, list.length, dir.fsPath));
  vscode.window.showInformationMessage(L.pulledInfo(n, path.basename(root.fsPath), lib, srcf));
}

// ---------------------------------------------------------------- upload
// kilde: "gem" | "watcher" | "manuel" | "compile" | "mappe" - kun til loggen
// bulk (valgfri): { decision: null|"overwriteAll"|"skipAll" } - deles mellem
// filerne i en mappe-upload, saa konfliktvalget "alle" huskes, og fejl kun
// logges i stedet for at poppe op én gang pr. fil.
// Returnerer true (uploadet), "unchanged" (sprunget over, uaendret) eller false.
async function uploadFile(fileUri, kilde, bulk) {
  const coords = parseMirrorPath(fileUri);
  if (!coords) {
    log(L.outsideMirror(kilde, fileUri.fsPath));
    return false;
  }
  const { lib, srcf, mbr, ext } = coords;
  const fail = (msg) => { if (bulk) log(msg); else vscode.window.showErrorMessage(msg); };

  const bytes = await vscode.workspace.fs.readFile(fileUri);
  if (!(bulk && bulk.force) && lastUpload.get(fileUri.fsPath) === contentHash(bytes)) {
    log(L.unchangedSkip(kilde, lib, srcf, mbr));
    return "unchanged";
  }

  const ctx = requireConnection();
  if (!ctx) return false;

  if (coords.root && !(await checkBinding(coords.root, ctx.conn))) return false;

  if (mbr.length > 10) {
    fail(L.nameTooLong(mbr));
    return false;
  }

  // Konfliktvagt: er memberet ændret på systemet siden vores baseline?
  // Fejler tjekket (VPN, autorisation), fortsættes der - vagten må aldrig
  // blokere en ellers gyldig upload.
  const doCheck = cfg("conflictCheck", true);
  if (doCheck) {
    try {
      const now = await memberTimestamp(ctx.conn, lib, srcf, mbr);
      const base = baselines[fileUri.fsPath];
      if (now && base && now !== base) {
        let pick;
        if (bulk) {
          if (bulk.decision === "overwriteAll") pick = L.btnOverwrite;
          else if (bulk.decision === "skipAll") pick = L.btnSkip;
          else {
            pick = await vscode.window.showWarningMessage(
              L.conflictMsg(lib, srcf, mbr, now),
              { modal: true },
              L.btnOverwrite,
              L.btnOverwriteAll,
              L.btnSkip,
              L.btnSkipAll
            );
            if (pick === L.btnOverwriteAll) { bulk.decision = "overwriteAll"; pick = L.btnOverwrite; }
            if (pick === L.btnSkipAll) { bulk.decision = "skipAll"; pick = L.btnSkip; }
          }
        } else {
          pick = await vscode.window.showWarningMessage(
            L.conflictMsg(lib, srcf, mbr, now),
            { modal: true },
            L.btnOverwrite,
            L.btnDiff
          );
        }
        if (pick === L.btnDiff) {
          // Venstre: memberet som det ser ud paa IBM i'en NU. Hoejre: din lokale fil.
          await vscode.commands.executeCommand(
            "vscode.diff",
            memberUri(lib, srcf, mbr, ext),
            fileUri,
            L.diffTitle(lib, srcf, mbr)
          );
          log(L.conflictDiffOpened(lib, srcf, mbr));
          return false;
        }
        if (pick !== L.btnOverwrite) {
          log(L.conflictCancelled(lib, srcf, mbr));
          return false;
        }
      }
    } catch (e) {
      log(L.conflictCheckFailed((e && e.message) || e));
    }
  }

  const target = memberUri(lib, srcf, mbr, ext);
  log(L.uploading(kilde, lib, srcf, mbr));

  const tryWrite = () => vscode.workspace.fs.writeFile(target, bytes);
  try {
    await tryWrite();
  } catch (e) {
    const msg = String((e && e.message) || e);
    if (/readonly mode/i.test(msg)) {
      log(L.readonlyLog);
      fail(L.readonlyMsg);
      return false;
    }
    log(L.writeFailedRetry(msg));
    const add = await ctx.conn.runCommand({
      command: `ADDPFM FILE(${lib}/${srcf}) MBR(${mbr}) SRCTYPE(${up(ext)})`,
      environment: "ile",
    });
    if (add.code !== 0) {
      log(L.addpfmFailed(add.stderr || add.stdout));
      fail(L.uploadFailed(lib, srcf, mbr, msg));
      return false;
    }
    try {
      await tryWrite();
    } catch (e2) {
      log(L.writeFailedRetry((e2 && e2.message) || e2));
      fail(L.uploadFailedAfterCreate(lib, srcf, mbr));
      return false;
    }
  }

  saveHash(fileUri.fsPath, contentHash(bytes));
  try {
    saveBaseline(fileUri.fsPath, await memberTimestamp(ctx.conn, lib, srcf, mbr));
  } catch { /* baseline er en hjælp, ikke et krav */ }
  log(L.uploadedOk(lib, srcf, mbr));
  vscode.window.setStatusBarMessage(L.statusUploaded(lib, srcf, mbr), 4000);
  refreshStatusBar();
  return true;
}

// Upload af en hel mappe i spejlet: LIB/KILDEFIL (alle members), LIB (alle
// kildefiler) eller selve spejlroden. De lokale filer er kilden - nye filer
// bliver til nye members via ADDPFM i uploadFile.
async function uploadMirrorDir(dirUri, force) {
  log(L.uploadDirStart(dirUri.fsPath, !!force));
  const scope = explainMirrorDir(dirUri);
  if (!scope) {
    log(L.dirNotInMirror(mirrorFolderName()));
    vscode.window.showWarningMessage(L.dirNotInMirror(mirrorFolderName()));
    return;
  }
  const ctx = requireConnection();
  if (!ctx) return;
  if (!(await checkBinding(scope.root, ctx.conn))) return;

  const label = scope.lib
    ? scope.srcf ? `${scope.lib}/${scope.srcf}` : scope.lib
    : path.basename(scope.root.fsPath);
  const files = await collectMirrorFiles(scope.root, scope.lib, scope.srcf);
  log(L.uploadDirFound(files.length, label));
  if (!files.length) {
    vscode.window.showWarningMessage(L.noLocalFiles(label));
    return;
  }

  if (!force) {
    const go = await vscode.window.showWarningMessage(
      L.uploadDirConfirm(files.length, label, connName(ctx.conn)),
      { modal: true },
      L.btnUploadAll
    );
    if (go !== L.btnUploadAll) { log(L.uploadDirDeclined); return; }
  }

  out.show(true);
  const bulk = { decision: null, force: !!force };
  const stat = { uploaded: 0, unchanged: 0, failed: 0, cancelled: false };
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: L.uploadingTitle(files.length, label),
      cancellable: true,
    },
    async (progress, token) => {
      for (const f of files) {
        if (token.isCancellationRequested) { stat.cancelled = true; break; }
        const rel = path.relative(scope.root.fsPath, f.fsPath).split(path.sep).join("/");
        progress.report({ message: rel, increment: 100 / files.length });
        try {
          const r = await uploadFile(f, "mappe", bulk);
          if (r === "unchanged") stat.unchanged++;
          else if (r) stat.uploaded++;
          else stat.failed++;
        } catch (e) {
          stat.failed++;
          log(L.uploadDirFileError(rel, (e && e.message) || e));
        }
      }
    }
  );

  if (stat.cancelled) log(L.bulkCancelled);
  log(L.uploadDirLog(label, stat.uploaded, stat.unchanged, stat.failed, files.length));
  const summary = L.uploadDirInfo(label, stat.uploaded, stat.unchanged, stat.failed);
  if (stat.failed) {
    const pick = await vscode.window.showWarningMessage(summary, L.btnShowOutput);
    if (pick === L.btnShowOutput) out.show(true);
  } else if (!force && !stat.cancelled && stat.uploaded === 0 && stat.unchanged > 0) {
    // Alt var "uaendret" ifoelge hash-vagten - tilbyd at uploade alligevel,
    // fx fordi memberet paa systemet er blevet aendret/slettet siden.
    const pick = await vscode.window.showInformationMessage(
      L.uploadDirAllUnchanged(label, stat.unchanged),
      L.btnUploadAnyway
    );
    if (pick === L.btnUploadAnyway) await uploadMirrorDir(dirUri, true);
  } else {
    vscode.window.showInformationMessage(summary);
  }
}

// ---------------------------------------------------------------- compile
const CRT = {
  rpg: (t, o, l, f, m) => `CRTRPGPGM PGM(${t}/${o}) SRCFILE(${l}/${f}) SRCMBR(${m})`,
  cl: (t, o, l, f, m) => `CRTCLPGM PGM(${t}/${o}) SRCFILE(${l}/${f}) SRCMBR(${m})`,
  rpgle: (t, o, l, f, m) => `CRTBNDRPG PGM(${t}/${o}) SRCFILE(${l}/${f}) SRCMBR(${m}) DBGVIEW(*SOURCE)`,
  sqlrpgle: (t, o, l, f, m) => `CRTSQLRPGI OBJ(${t}/${o}) SRCFILE(${l}/${f}) SRCMBR(${m}) COMMIT(*NONE) OBJTYPE(*PGM) DBGVIEW(*SOURCE)`,
  clle: (t, o, l, f, m) => `CRTBNDCL PGM(${t}/${o}) SRCFILE(${l}/${f}) SRCMBR(${m}) DBGVIEW(*SOURCE)`,
  clp: (t, o, l, f, m) => `CRTCLPGM PGM(${t}/${o}) SRCFILE(${l}/${f}) SRCMBR(${m})`,
  cmd: (t, o, l, f, m) => `CRTCMD CMD(${t}/${o}) PGM(*LIBL/${o}) SRCFILE(${l}/${f}) SRCMBR(${m})`,
  sql: (_t, _o, l, f, m) => `RUNSQLSTM SRCFILE(${l}/${f}) SRCMBR(${m}) COMMIT(*NONE)`,
  pf: (t, o, l, f, m) => `CRTPF FILE(${t}/${o}) SRCFILE(${l}/${f}) SRCMBR(${m})`,
  lf: (t, o, l, f, m) => `CRTLF FILE(${t}/${o}) SRCFILE(${l}/${f}) SRCMBR(${m})`,
  dspf: (t, o, l, f, m) => `CRTDSPF FILE(${t}/${o}) SRCFILE(${l}/${f}) SRCMBR(${m})`,
  prtf: (t, o, l, f, m) => `CRTPRTF FILE(${t}/${o}) SRCFILE(${l}/${f}) SRCMBR(${m})`,
};

async function compileCurrent() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const coords = parseMirrorPath(editor.document.uri);
  if (!coords) {
    vscode.window.showWarningMessage(L.notInMirrorWarn);
    return;
  }
  const ctx = requireConnection();
  if (!ctx) return;

  await editor.document.save();
  const ok = await uploadFile(editor.document.uri, "compile");
  if (!ok) return;

  const { lib, srcf, mbr, ext } = coords;
  let tgt = up(cfg("targetLibrary", ""));
  if (!tgt) {
    tgt = up(
      (await vscode.window.showInputBox({
        prompt: L.promptTargetLib,
        placeHolder: "MYLIB",
      })) || ""
    );
    if (!tgt) return;
  }

  const maker = CRT[ext];
  if (!maker) {
    vscode.window.showErrorMessage(L.unknownExt(ext));
    return;
  }
  const cmd = maker(tgt, mbr, lib, srcf, mbr);

  out.show(true);
  log(`=== ${cmd}`);
  const res = await ctx.conn.runCommand({ command: cmd, environment: "ile" });
  if (res.stdout) out.appendLine(res.stdout);
  if (res.stderr) out.appendLine(res.stderr);
  if (res.code === 0) {
    log(L.compiledOkLog(tgt, mbr));
    vscode.window.setStatusBarMessage(L.statusCompiled(tgt, mbr), 5000);
  } else {
    vscode.window.showErrorMessage(L.compileFailed(mbr));
  }

  // Skriv resultatet hvor en AI-agent kan laese det og selv lukke loekken.
  if (coords.root) {
    try {
      const dir = vscode.Uri.joinPath(coords.root, ".compile");
      await vscode.workspace.fs.createDirectory(dir);
      const body =
        `time: ${new Date().toISOString()}\n` +
        `member: ${lib}/${srcf}(${mbr})\n` +
        `command: ${cmd}\n` +
        `status: ${res.code === 0 ? "OK" : "FAILED"}\n\n` +
        (res.stdout || "") + (res.stderr ? "\n" + res.stderr : "");
      const f = vscode.Uri.joinPath(dir, "last.txt");
      await vscode.workspace.fs.writeFile(f, Buffer.from(body, "utf8"));
      log(L.compileResultWritten(f.fsPath));
    } catch (e) {
      log(String((e && e.message) || e));
    }
  }
}

// ---------------------------------------------------------------- CLAUDE.md
// Instruktionsfiler til AI-agenter. Broen er agent-agnostisk: CLAUDE.md er
// Claude Codes konvention, AGENTS.md laeses af bl.a. Codex og Cursor. Andre
// vaerktoejer (GEMINI.md, .github/copilot-instructions.md) kan kopiere indholdet.
async function ensureInstructionFiles(root) {
  const files = [
    ["CLAUDE.md", L.claudeMd],
    ["AGENTS.md", L.agentsMd],
  ];
  for (const [name, text] of files) {
    const uri = vscode.Uri.joinPath(root, name);
    try {
      await vscode.workspace.fs.stat(uri);
      continue; // findes allerede - roer den ikke
    } catch {
      /* opret */
    }
    await vscode.workspace.fs.writeFile(uri, Buffer.from(text, "utf8"));
  }
}

// ---------------------------------------------------------------- statuslinje
let statusItem;

// Tooltip med klikbare genveje: vejledningen og outputpanelet. Markdown med
// command:-links kraever isTrusted.
function statusTooltip(text) {
  const md = new vscode.MarkdownString(
    `${text}\n\n[$(book) ${L.tipManual}](command:bridgeForI.openManual) · ` +
    `[$(output) ${L.tipOutput}](command:bridgeForI.showOutput)`
  );
  md.isTrusted = true;
  md.supportThemeIcons = true;
  return md;
}

async function refreshStatusBar() {
  if (!statusItem) return;
  const instance = getInstance();
  const conn = instance && instance.getConnection();
  if (!conn) {
    statusItem.text = L.statusNoConn;
    statusItem.tooltip = statusTooltip(L.tipNoConn);
    statusItem.backgroundColor = undefined;
  } else {
    const active = connName(conn);
    let bound;
    const root = mirrorRoot();
    if (root) {
      try { bound = (await readManifest(root)).connection; } catch { /* ok */ }
    }
    if (bound && bound !== active) {
      statusItem.text = L.statusMismatch(active);
      statusItem.tooltip = statusTooltip(L.tipMismatch(active, bound));
      statusItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
    } else {
      statusItem.text = L.statusOk(active);
      statusItem.tooltip = statusTooltip(L.tipOk(active));
      statusItem.backgroundColor = undefined;
    }
  }
  statusItem.show();
}

// ---------------------------------------------------------------- watcher
// Fanger skrivninger UDENOM editoren (Claude Code skriver direkte paa disken).
let watchers = [];
function rebuildWatcher(context) {
  for (const w of watchers) w.dispose();
  watchers = [];
  const ws = vscode.workspace.workspaceFolders;
  if (!ws || !ws.length) {
    log(L.noWorkspaceWatcher);
    return;
  }
  const folder = mirrorFolderName();
  for (const wsf of ws) {
    const w = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(wsf, `${folder}/**`)
    );
  const onDisk = (uri) => {
    const auto = cfg("autoUploadOnSave", true);
    if (!auto) return;
    if (["CLAUDE.md", "AGENTS.md", ".bridge.json"].includes(path.basename(uri.fsPath))) return;
    if (uri.fsPath.includes(path.sep + ".compile" + path.sep)) return;
    if (selfWrites.has(uri.fsPath)) {
      log(L.watcherSelfWrite(path.basename(uri.fsPath)));
      return;
    }
    if (!parseMirrorPath(uri)) return;
    clearTimeout(pending.get(uri.fsPath));
    pending.set(
      uri.fsPath,
      setTimeout(async () => {
        pending.delete(uri.fsPath);
        try {
          await uploadFile(uri, "watcher");
        } catch (e) {
          log(L.watcherError(uri.fsPath, e.message || e));
        }
      }, 700)
    );
  };
    w.onDidChange(onDisk);
    w.onDidCreate(onDisk);
    context.subscriptions.push(w);
    watchers.push(w);
    log(L.watching(wsf.uri.fsPath + path.sep + folder));
  }
}

// ---------------------------------------------------------------- aktivering
function activate(context) {
  extContext = context;
  baselines = context.workspaceState.get("ibmiBridge.baselines", {});
  for (const [k, v] of Object.entries(context.workspaceState.get("ibmiBridge.hashes", {})))
    lastUpload.set(k, v);
  out = vscode.window.createOutputChannel("IBM i Bridge");
  log(L.active("v0.10.2"));

  context.subscriptions.push(
    vscode.commands.registerCommand("bridgeForI.pull", async () => {
      const spec = await vscode.window.showInputBox({
        prompt: L.pullPrompt,
        placeHolder: L.pullPlaceholder,
      });
      if (!spec) return;
      const parts = up(spec).split("/").filter(Boolean);
      if (parts.length < 2) {
        vscode.window.showErrorMessage(L.pullFormatError);
        return;
      }
      await pullMembers(parts[0], parts[1], parts[2]);
    }),

    vscode.commands.registerCommand("bridgeForI.pullNode", async (node) => {
      const m = node && (node.member || node.object || node);
      const lib = m && (m.library || m.lib);
      const file = m && (m.file || m.sourceFile || m.name);
      const name = node && node.member ? m.name : undefined;
      if (lib && file) {
        await pullMembers(lib, node.member ? m.file : file, name);
      } else {
        await vscode.commands.executeCommand("bridgeForI.pull");
      }
    }),

    vscode.commands.registerCommand("bridgeForI.compile", compileCurrent),

    vscode.commands.registerCommand("bridgeForI.pullCurrent", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const coords = parseMirrorPath(editor.document.uri);
      if (!coords) {
        vscode.window.showWarningMessage(L.notInMirrorWarn);
        return;
      }
      const ctx = requireConnection();
      if (!ctx) return;
      const { lib, srcf, mbr, ext } = coords;
      if (coords.root && !(await checkBinding(coords.root, ctx.conn))) return;
      try {
        const bytes = await vscode.workspace.fs.readFile(memberUri(lib, srcf, mbr, ext));
        selfWrites.add(editor.document.uri.fsPath);
        try {
          await vscode.workspace.fs.writeFile(editor.document.uri, bytes);
          saveHash(editor.document.uri.fsPath, contentHash(bytes));
          saveBaseline(editor.document.uri.fsPath, await memberTimestamp(ctx.conn, lib, srcf, mbr));
        } finally {
          setTimeout(() => selfWrites.delete(editor.document.uri.fsPath), 2500);
        }
        log(L.rePulled(lib, srcf, mbr));
        vscode.window.setStatusBarMessage(L.rePulled(lib, srcf, mbr), 5000);
      } catch (e) {
        log(L.rePullFailed((e && e.message) || e));
        vscode.window.showErrorMessage(L.rePullFailed((e && e.message) || e));
      }
    }),

    // Manuel upload - baade som noedudgang og som diagnose
    vscode.commands.registerCommand("bridgeForI.uploadCurrent", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      await editor.document.save();
      out.show(true);
      await uploadFile(editor.document.uri, "manuel");
    }),

    // Upload en hel mappe (LIB/KILDEFIL, LIB eller hele spejlet).
    // Fra Explorer-hoejreklik kommer mappens uri; fra paletten bruges den
    // aktive fils mappe, ellers spoerges der om BIBLIOTEK/KILDEFIL.
    vscode.commands.registerCommand("bridgeForI.uploadFolder", async (uri) => {
      out.show(true);
      log(L.uploadFolderInvoked(
        uri instanceof vscode.Uri ? uri.fsPath
          : uri && uri.member ? `member ${uri.member.library}/${uri.member.file}(${uri.member.name})`
          : uri && uri.object ? `object ${uri.object.library}/${uri.object.name}`
          : uri ? Object.keys(uri).join(",") : "palette"
      ));
      let dir = uri instanceof vscode.Uri ? uri : undefined;
      // Fra Object Browser: kildefil-node -> spejlets LIB/KILDEFIL-mappe,
      // member-node -> den ene lokale fil.
      if (!dir && uri && (uri.member || uri.object)) {
        const root = mirrorRoot();
        if (!root) { vscode.window.showErrorMessage(L.openFolderFirst); return; }
        if (uri.member) {
          const m = uri.member;
          const ext = String(m.extension || "txt").toLowerCase();
          const local = vscode.Uri.joinPath(root, up(m.library), up(m.file), `${up(m.name)}.${ext}`);
          try { await vscode.workspace.fs.stat(local); }
          catch { vscode.window.showWarningMessage(L.noLocalFiles(`${up(m.library)}/${up(m.file)}(${up(m.name)})`)); return; }
          out.show(true);
          await uploadFile(local, "manuel");
          return;
        }
        dir = vscode.Uri.joinPath(root, up(uri.object.library), up(uri.object.name));
      }
      if (!dir) {
        const editor = vscode.window.activeTextEditor;
        if (editor && parseMirrorPath(editor.document.uri))
          dir = vscode.Uri.joinPath(editor.document.uri, "..");
      }
      if (!dir) {
        const root = mirrorRoot();
        if (!root) { vscode.window.showErrorMessage(L.openFolderFirst); return; }
        const spec = await vscode.window.showInputBox({
          prompt: L.uploadDirPrompt,
          placeHolder: L.pullPlaceholder,
        });
        if (!spec) return;
        const parts = up(spec).split("/").filter(Boolean);
        if (parts.length < 1 || parts.length > 2) {
          vscode.window.showErrorMessage(L.uploadDirFormatError);
          return;
        }
        dir = vscode.Uri.joinPath(root, ...parts);
      }
      await uploadMirrorDir(dir);
    }),

    // VEJ 1: editor-gem (Ctrl+S). Paalidelig paa alle platforme.
    vscode.workspace.onDidSaveTextDocument(async (doc) => {
      const auto = cfg("autoUploadOnSave", true);
      if (!auto) return;
      if (doc.uri.scheme !== "file") return;
      if (["CLAUDE.md", "AGENTS.md", ".bridge.json"].includes(path.basename(doc.uri.fsPath))) return;
      if (doc.uri.fsPath.includes(path.sep + ".compile" + path.sep)) return;
      const svar = explainMirrorPath(doc.uri);
      if (!svar.coords) {
        // Log kun hvis filen ligner et spejl (stien indeholder /ibmi/) - ellers stoej
        if (doc.uri.fsPath.includes(path.sep + mirrorFolderName() + path.sep))
          log(L.saveRejected(path.basename(doc.uri.fsPath), svar.reason));
        return;
      }
      log(L.saveEvent(path.basename(doc.uri.fsPath)));
      try {
        await uploadFile(doc.uri, "gem");
      } catch (e) {
        log(L.saveError(e.message || e));
      }
    }),

    vscode.workspace.onDidChangeWorkspaceFolders(() => rebuildWatcher(context))
  );

  // VEJ 2: filsystem-watcher (fanger Claude Codes direkte skrivninger)
  rebuildWatcher(context);

  // Statuslinje: viser altid hvilken forbindelse uploads gaar til
  statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 90);
  statusItem.command = "bridgeForI.showOutput";
  context.subscriptions.push(
    statusItem,
    vscode.commands.registerCommand("bridgeForI.showOutput", () => out.show(true)),

    // README.md ER vejledningen (den vises som Details-fanen paa extension-
    // siden). Her aabnes den som Markdown-preview. vsce pakker filen som
    // "readme.md" (smaat); i udviklingstilstand hedder den README.md - proev
    // begge. Den danske udgave ligger i samme fil - hop til dens overskrift,
    // naar VS Code koerer paa dansk. Fallback: aabn som tekst.
    vscode.commands.registerCommand("bridgeForI.openManual", async () => {
      let base;
      for (const name of ["README.md", "readme.md"]) {
        const u = vscode.Uri.joinPath(context.extensionUri, name);
        try { await vscode.workspace.fs.stat(u); base = u; break; } catch { /* naeste */ }
      }
      if (!base) base = vscode.Uri.joinPath(context.extensionUri, "README.md");
      const uri = L === DA
        ? base.with({ fragment: "bridge-for-ibm-i--komplet-vejledning-dansk" })
        : base;
      try {
        await vscode.commands.executeCommand("markdown.showPreview", uri);
      } catch (e) {
        log(L.manualOpenFallback((e && e.message) || e));
        await vscode.window.showTextDocument(base, { preview: true });
      }
    })
  );
  const instance = getInstance();
  if (instance && typeof instance.subscribe === "function") {
    instance.subscribe(context, "connected", "Bridge for i status bar", refreshStatusBar);
    instance.subscribe(context, "disconnected", "Bridge for i status bar", refreshStatusBar);
  }
  refreshStatusBar();
}

function deactivate() {}

module.exports = { activate, deactivate };
