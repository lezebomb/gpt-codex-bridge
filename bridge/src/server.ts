import express, { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import readline from "node:readline";

const app = express();
app.use(express.json({ limit: "8mb" }));

const dashboardDir = path.join(process.cwd(), "public");
app.use("/dashboard", express.static(dashboardDir));
app.get("/", (_req, res) => res.redirect("/dashboard/"));

const PORT = Number(process.env.BRIDGE_PORT || 8787);
const HOST = process.env.BRIDGE_HOST || "127.0.0.1";
const VERSION = "1.0.0";
const executionModeSchema = z.enum(["dry-run", "cli", "app-server"]);
const DEFAULT_EXECUTION = executionModeSchema.catch("dry-run").parse(process.env.CODEX_EXECUTION || "dry-run");
const CODEX_BIN = process.env.CODEX_BIN || "codex";
const CODEX_ARGS = (process.env.CODEX_ARGS || "exec --json").split(" ").filter(Boolean);
const CODEX_APP_SERVER_MODEL = process.env.CODEX_APP_SERVER_MODEL || "";
const CODEX_APP_SERVER_APPROVAL_POLICY = process.env.CODEX_APP_SERVER_APPROVAL_POLICY || "unlessTrusted";
const CODEX_APP_SERVER_SANDBOX = process.env.CODEX_APP_SERVER_SANDBOX || "workspaceWrite";
const CODEX_APP_SERVER_NETWORK = process.env.CODEX_APP_SERVER_NETWORK === "true";
const CODEX_JOB_TIMEOUT_MS = Number(process.env.CODEX_JOB_TIMEOUT_MS || 20 * 60 * 1000);
const CODEX_APP_SERVER_APPROVAL_RESPONSE = process.env.CODEX_APP_SERVER_APPROVAL_RESPONSE || "prompt"; // prompt | decline | accept
const REQUIRE_APPROVAL_FOR_ALL_RUNS = process.env.REQUIRE_APPROVAL_FOR_ALL_RUNS !== "false";
const ROOT = path.resolve(process.cwd());
const dataDir = path.join(ROOT, "data");
const stateFile = path.join(dataDir, "state.json");
const runtimeFile = path.join(dataDir, "runtime.json");
const MAX_FILE_BYTES = Number(process.env.MAX_FILE_BYTES || 200_000);
const MAX_SNAPSHOT_FILES = Number(process.env.MAX_SNAPSHOT_FILES || 40);
const repoRoot = path.resolve(ROOT, "..");

const ROLE_DIR = path.resolve(repoRoot, "roles");
const SKILL_DIR = path.resolve(repoRoot, ".agents", "skills");

const jobStatus = z.enum([
  "draft",
  "queued",
  "needs_approval",
  "running",
  "completed",
  "failed",
  "cancelled",
  "rejected"
]);

const permissionModeSchema = z.enum(["read_only", "manual_review", "auto_review", "full_access"]);
const approvalPolicySchema = z.enum(["never", "onRequest", "unlessTrusted"]);
const sandboxModeSchema = z.enum(["readOnly", "workspaceWrite", "dangerFullAccess"]);

type PermissionMode = z.infer<typeof permissionModeSchema>;
type ApprovalPolicy = z.infer<typeof approvalPolicySchema>;
type SandboxMode = z.infer<typeof sandboxModeSchema>;
type ExecutionMode = z.infer<typeof executionModeSchema>;

type RuntimeSettings = {
  token: string;
  execution: ExecutionMode;
  updatedAt: string;
};

type BridgeSettings = {
  permissionMode: PermissionMode;
  requireApprovalForAllRuns: boolean;
  allowLowRiskAutoRun: boolean;
  allowWebPatchApply: boolean;
  codexApprovalPolicy: ApprovalPolicy;
  codexSandboxMode: SandboxMode;
  appServerApprovalResponse: "prompt" | "decline" | "accept";
  networkAccess: boolean;
  maxReviewRoundsDefault: number;
  logLevel: "info" | "debug";
};

type LogEntry = {
  id: string;
  at: string;
  level: "debug" | "info" | "warn" | "error";
  scope: string;
  message: string;
  requestId?: string;
  data?: unknown;
};

type Project = {
  id: string;
  name: string;
  path: string;
  allowShell: boolean;
  createdAt: string;
  updatedAt: string;
};

type JobEvent = {
  at: string;
  type: string;
  message: string;
  data?: unknown;
};

type Job = {
  id: string;
  projectId: string;
  title: string;
  task: string;
  roles: string[];
  status: z.infer<typeof jobStatus>;
  safetyLevel: number;
  requiresApproval: boolean;
  approvedAt?: string;
  rejectedAt?: string;
  codexPrompt: string;
  result?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  error?: string;
  events: JobEvent[];
  createdAt: string;
  updatedAt: string;
};

type WebPatchChange = {
  filePath: string;
  content: string;
  mode: "create" | "overwrite";
};

type WebPatch = {
  id: string;
  projectId: string;
  title: string;
  rationale: string;
  status: "draft" | "needs_approval" | "applied" | "rejected" | "reverted";
  changes: WebPatchChange[];
  createdBy: "chatgpt-web" | "user";
  appliedAt?: string;
  rejectedAt?: string;
  events: JobEvent[];
  createdAt: string;
  updatedAt: string;
};

type ReviewSession = {
  id: string;
  projectId: string;
  title: string;
  webPatchId?: string;
  codexJobId?: string;
  webSummary?: string;
  codexSummary?: string;
  status: "open" | "accepted" | "needs_human" | "cancelled";
  maxRounds: number;
  roundsUsed: number;
  decision?: "web" | "codex" | "hybrid" | "needs_human";
  rationale?: string;
  events: JobEvent[];
  createdAt: string;
  updatedAt: string;
};

type ApprovalRequest = {
  id: string;
  jobId: string;
  method: string;
  params: unknown;
  status: "pending" | "approved" | "declined" | "expired";
  decision?: "accept" | "decline" | "cancel";
  expiresAt: string;
  events: JobEvent[];
  createdAt: string;
  updatedAt: string;
};

type RepairProposal = {
  id: string;
  projectId?: string;
  sourceRequestId?: string;
  sourceLogId?: string;
  sourceKind: "http_error" | "job_failure" | "manual";
  errorSummary: string;
  conciseDiagnosis: string;
  solution: string;
  executionPlan: string[];
  codexTask?: string;
  safetyLevel: number;
  status: "needs_approval" | "approved" | "executed" | "rejected" | "failed";
  createdBy: "chatgpt-web" | "user";
  createdCodexJobId?: string;
  events: JobEvent[];
  createdAt: string;
  updatedAt: string;
};

type State = { projects: Project[]; jobs: Job[]; webPatches: WebPatch[]; reviewSessions: ReviewSession[]; approvalRequests: ApprovalRequest[]; repairProposals: RepairProposal[]; settings: BridgeSettings };

function now(): string {
  return new Date().toISOString();
}

function generateLocalToken(): string {
  return `bridge-${nanoid(24)}`;
}

function normalizeRuntime(input: unknown): RuntimeSettings {
  const value = input && typeof input === "object" ? (input as Partial<RuntimeSettings>) : {};
  const token = String(value.token || process.env.BRIDGE_TOKEN || generateLocalToken()).trim();
  return {
    token: token || generateLocalToken(),
    execution: executionModeSchema.catch(DEFAULT_EXECUTION).parse(value.execution || DEFAULT_EXECUTION),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now()
  };
}

function loadRuntime(): RuntimeSettings {
  fs.mkdirSync(dataDir, { recursive: true });
  let parsed: unknown = {};
  if (fs.existsSync(runtimeFile)) {
    try {
      parsed = JSON.parse(fs.readFileSync(runtimeFile, "utf8"));
    } catch {
      parsed = {};
    }
  }
  const runtime = normalizeRuntime(parsed);
  if (!fs.existsSync(runtimeFile)) {
    fs.writeFileSync(runtimeFile, JSON.stringify(runtime, null, 2), "utf8");
  }
  return runtime;
}

function saveRuntime(runtime: RuntimeSettings): RuntimeSettings {
  fs.mkdirSync(dataDir, { recursive: true });
  const normalized = normalizeRuntime({ ...runtime, updatedAt: now() });
  fs.writeFileSync(runtimeFile, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

function currentToken(): string {
  return loadRuntime().token;
}

function currentExecution(): ExecutionMode {
  return loadRuntime().execution;
}

function tokenPreview(token = currentToken()): string {
  if (token.length <= 8) return "****";
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

function isLoopbackRequest(req: Request): boolean {
  const remote = String(req.socket.remoteAddress || req.ip || "").replace(/^::ffff:/, "");
  return remote === "127.0.0.1" || remote === "::1" || remote === "localhost" || remote === "";
}

function settingsForMode(mode: PermissionMode): BridgeSettings {
  if (mode === "read_only") {
    return {
      permissionMode: "read_only",
      requireApprovalForAllRuns: true,
      allowLowRiskAutoRun: false,
      allowWebPatchApply: false,
      codexApprovalPolicy: "onRequest",
      codexSandboxMode: "readOnly",
      appServerApprovalResponse: "decline",
      networkAccess: false,
      maxReviewRoundsDefault: 1,
      logLevel: "info"
    };
  }
  if (mode === "auto_review") {
    return {
      permissionMode: "auto_review",
      requireApprovalForAllRuns: false,
      allowLowRiskAutoRun: true,
      allowWebPatchApply: true,
      codexApprovalPolicy: "unlessTrusted",
      codexSandboxMode: "workspaceWrite",
      appServerApprovalResponse: "prompt",
      networkAccess: false,
      maxReviewRoundsDefault: 2,
      logLevel: "info"
    };
  }
  if (mode === "full_access") {
    return {
      permissionMode: "full_access",
      requireApprovalForAllRuns: false,
      allowLowRiskAutoRun: true,
      allowWebPatchApply: true,
      codexApprovalPolicy: "never",
      codexSandboxMode: "dangerFullAccess",
      appServerApprovalResponse: "accept",
      networkAccess: true,
      maxReviewRoundsDefault: 2,
      logLevel: "debug"
    };
  }
  return {
    permissionMode: "manual_review",
    requireApprovalForAllRuns: true,
    allowLowRiskAutoRun: false,
    allowWebPatchApply: true,
    codexApprovalPolicy: "onRequest",
    codexSandboxMode: "workspaceWrite",
    appServerApprovalResponse: "prompt",
    networkAccess: false,
    maxReviewRoundsDefault: 2,
    logLevel: "info"
  };
}

function defaultSettings(): BridgeSettings {
  const envMode = permissionModeSchema.catch("manual_review").parse(process.env.BRIDGE_PERMISSION_MODE || process.env.ACCESS_MODE || "manual_review");
  const base = settingsForMode(envMode);
  return {
    ...base,
    requireApprovalForAllRuns: process.env.REQUIRE_APPROVAL_FOR_ALL_RUNS === undefined ? base.requireApprovalForAllRuns : process.env.REQUIRE_APPROVAL_FOR_ALL_RUNS !== "false",
    codexApprovalPolicy: approvalPolicySchema.catch(base.codexApprovalPolicy).parse(process.env.CODEX_APP_SERVER_APPROVAL_POLICY || base.codexApprovalPolicy),
    codexSandboxMode: sandboxModeSchema.catch(base.codexSandboxMode).parse(process.env.CODEX_APP_SERVER_SANDBOX || base.codexSandboxMode),
    appServerApprovalResponse: ["accept", "decline", "prompt"].includes(String(process.env.CODEX_APP_SERVER_APPROVAL_RESPONSE)) ? (process.env.CODEX_APP_SERVER_APPROVAL_RESPONSE as "accept" | "decline" | "prompt") : base.appServerApprovalResponse,
    networkAccess: process.env.CODEX_APP_SERVER_NETWORK === undefined ? base.networkAccess : process.env.CODEX_APP_SERVER_NETWORK === "true"
  };
}

function normalizeSettings(input: unknown): BridgeSettings {
  const fallback = defaultSettings();
  if (!input || typeof input !== "object") return fallback;
  const value = input as Partial<BridgeSettings>;
  const mode = permissionModeSchema.catch(fallback.permissionMode).parse(value.permissionMode || fallback.permissionMode);
  const preset = settingsForMode(mode);
  return {
    ...preset,
    ...value,
    permissionMode: mode,
    codexApprovalPolicy: approvalPolicySchema.catch(preset.codexApprovalPolicy).parse(value.codexApprovalPolicy || preset.codexApprovalPolicy),
    codexSandboxMode: sandboxModeSchema.catch(preset.codexSandboxMode).parse(value.codexSandboxMode || preset.codexSandboxMode),
    appServerApprovalResponse: ["accept", "decline", "prompt"].includes(String(value.appServerApprovalResponse)) ? (value.appServerApprovalResponse as "accept" | "decline" | "prompt") : preset.appServerApprovalResponse,
    maxReviewRoundsDefault: Math.max(1, Math.min(3, Number(value.maxReviewRoundsDefault || preset.maxReviewRoundsDefault)))
  };
}

function loadState(): State {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(stateFile)) {
    const initial: State = { projects: [], jobs: [], webPatches: [], reviewSessions: [], approvalRequests: [], repairProposals: [], settings: defaultSettings() };
    fs.writeFileSync(stateFile, JSON.stringify(initial, null, 2));
    return initial;
  }
  const parsed = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  return {
    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
    webPatches: Array.isArray(parsed.webPatches) ? parsed.webPatches : [],
    reviewSessions: Array.isArray(parsed.reviewSessions) ? parsed.reviewSessions : [],
    approvalRequests: Array.isArray(parsed.approvalRequests) ? parsed.approvalRequests : [],
    repairProposals: Array.isArray(parsed.repairProposals) ? parsed.repairProposals : [],
    settings: normalizeSettings(parsed.settings)
  };
}

function saveState(state: State): void {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

function updateJob(jobId: string, mutate: (job: Job, state: State) => void): Job {
  const state = loadState();
  const job = state.jobs.find((j) => j.id === jobId);
  if (!job) throw new Error("job not found");
  mutate(job, state);
  job.updatedAt = now();
  saveState(state);
  return job;
}

function appendJobEvent(jobId: string, type: string, message: string, data?: unknown): void {
  try {
    updateJob(jobId, (job) => {
      job.events.push({ at: now(), type, message, data });
    });
  } catch {
    // Event mirroring must never crash the runner.
  }
}

function compactForLog(value: unknown, max = 3000): unknown {
  let text = "";
  try {
    text = JSON.stringify(value);
  } catch {
    text = String(value);
  }
  if (!text || text.length <= max) return value;
  return { truncated: true, preview: text.slice(0, max) };
}

function logFileForDate(date = new Date()): string {
  const yyyyMmDd = date.toISOString().slice(0, 10);
  return path.join(dataDir, "logs", `${yyyyMmDd}.jsonl`);
}

function writeLog(level: LogEntry["level"], scope: string, message: string, data?: unknown, requestId?: string): LogEntry {
  fs.mkdirSync(path.join(dataDir, "logs"), { recursive: true });
  const entry: LogEntry = { id: nanoid(10), at: now(), level, scope, message, requestId, data: data === undefined ? undefined : compactForLog(data, 5000) };
  fs.appendFileSync(logFileForDate(), `${JSON.stringify(entry)}\n`, "utf8");
  return entry;
}

function readRecentLogs(limit = 100, level?: string): LogEntry[] {
  const dir = path.join(dataDir, "logs");
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((name) => name.endsWith(".jsonl")).sort().reverse();
  const out: LogEntry[] = [];
  for (const file of files) {
    const lines = fs.readFileSync(path.join(dir, file), "utf8").split("\n").filter(Boolean).reverse();
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as LogEntry;
        if (!level || entry.level === level) out.push(entry);
        if (out.length >= limit) return out;
      } catch {
        // Ignore malformed log lines.
      }
    }
  }
  return out;
}

function currentSettings(): BridgeSettings {
  return loadState().settings;
}

function requiresApprovalForJob(safetyLevel: number, settings: BridgeSettings): boolean {
  if (settings.permissionMode === "full_access") return false;
  if (settings.permissionMode === "read_only") return true;
  if (settings.requireApprovalForAllRuns) return true;
  if (settings.permissionMode === "auto_review") return safetyLevel >= 3;
  return safetyLevel >= 2;
}

function assertMutationsAllowed(settings: BridgeSettings, action: string): void {
  if (settings.permissionMode === "read_only") throw new Error(`${action} is blocked because permission mode is read_only`);
}

function auth(req: Request, res: Response, next: NextFunction): void {
  if (req.path === "/health" || req.path === "/bootstrap") return next();
  const header = req.header("authorization") || "";
  if (header !== `Bearer ${currentToken()}`) {
    const requestId = (req as Request & { requestId?: string }).requestId || nanoid(8);
    writeLog("warn", "auth", "Unauthorized request", { method: req.method, path: req.path }, requestId);
    res.status(401).json({
      error: "unauthorized",
      message: "Bearer token is missing or invalid",
      requestId,
      logHint: "Open Dashboard > Logs or call GET /logs?level=warn"
    });
    return;
  }
  next();
}

function expandHome(inputPath: string): string {
  if (inputPath === "~") return os.homedir();
  return inputPath.startsWith("~/") ? path.join(os.homedir(), inputPath.slice(2)) : inputPath;
}

function safeProjectPath(inputPath: string): string {
  const resolved = path.resolve(expandHome(inputPath));
  if (!fs.existsSync(resolved)) throw new Error("project path does not exist");
  const stat = fs.statSync(resolved);
  if (!stat.isDirectory()) throw new Error("project path is not a directory");
  return resolved;
}

const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", ".next", "coverage", ".turbo", ".cache"]);

function assertSafeRelativePath(relativePath: string): string {
  if (!relativePath || relativePath.includes("\0")) throw new Error("invalid file path");
  if (path.isAbsolute(relativePath)) throw new Error("absolute file paths are not allowed");
  const normalized = path.normalize(relativePath).replace(/^([/\\])+/, "");
  if (normalized === "." || normalized.startsWith("..") || normalized.includes(`${path.sep}..${path.sep}`)) {
    throw new Error("path traversal is not allowed");
  }
  const parts = normalized.split(/[\\/]+/);
  if (parts.some((part) => IGNORED_DIRS.has(part))) throw new Error("access to ignored directories is not allowed");
  return normalized;
}

function resolveProjectFile(project: Project, relativePath: string): string {
  const safeRelative = assertSafeRelativePath(relativePath);
  const fullPath = path.resolve(project.path, safeRelative);
  const projectRoot = path.resolve(project.path);
  if (fullPath !== projectRoot && !fullPath.startsWith(projectRoot + path.sep)) {
    throw new Error("resolved path escapes project root");
  }
  return fullPath;
}

function walkFiles(root: string, current = "", limit = 250): Array<{ path: string; type: "file" | "dir"; size?: number }> {
  const absolute = path.join(root, current);
  if (!fs.existsSync(absolute)) return [];
  const entries = fs
    .readdirSync(absolute, { withFileTypes: true })
    .filter((entry) => !IGNORED_DIRS.has(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  const out: Array<{ path: string; type: "file" | "dir"; size?: number }> = [];
  for (const entry of entries) {
    if (out.length >= limit) break;
    const rel = path.join(current, entry.name);
    const full = path.join(root, rel);
    if (entry.isDirectory()) {
      out.push({ path: rel, type: "dir" });
      out.push(...walkFiles(root, rel, Math.max(0, limit - out.length)));
    } else if (entry.isFile()) {
      const stat = fs.statSync(full);
      out.push({ path: rel, type: "file", size: stat.size });
    }
  }
  return out.slice(0, limit);
}

function readProjectFile(project: Project, relativePath: string, maxBytes = MAX_FILE_BYTES) {
  const fullPath = resolveProjectFile(project, relativePath);
  if (!fs.existsSync(fullPath)) throw new Error("file not found");
  const stat = fs.statSync(fullPath);
  if (!stat.isFile()) throw new Error("path is not a file");
  if (stat.size > maxBytes) throw new Error(`file too large: ${stat.size} bytes > ${maxBytes} bytes`);
  return {
    path: assertSafeRelativePath(relativePath),
    size: stat.size,
    updatedAt: stat.mtime.toISOString(),
    content: fs.readFileSync(fullPath, "utf8")
  };
}

function runGit(project: Project, args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve) => {
    const child = spawn("git", args, { cwd: project.path, env: process.env, shell: false });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (err) => resolve({ stdout, stderr: stderr + `\n${err.message}`, exitCode: 1 }));
    child.on("close", (code) => resolve({ stdout, stderr, exitCode: code }));
  });
}

function validatePatch(project: Project, changes: WebPatchChange[]) {
  if (!changes.length) throw new Error("patch must include at least one change");
  if (changes.length > 20) throw new Error("too many files in one web patch; split into smaller patches");
  return changes.map((change) => {
    const normalized = assertSafeRelativePath(change.filePath);
    const fullPath = resolveProjectFile(project, normalized);
    const exists = fs.existsSync(fullPath);
    if (change.mode === "create" && exists) throw new Error(`file already exists: ${normalized}`);
    if (change.mode === "overwrite" && exists && !fs.statSync(fullPath).isFile()) throw new Error(`not a file: ${normalized}`);
    if (Buffer.byteLength(change.content, "utf8") > MAX_FILE_BYTES) {
      throw new Error(`file content too large for ${normalized}`);
    }
    return { ...change, filePath: normalized };
  });
}

function applyWebPatch(patch: WebPatch, project: Project) {
  const changes = validatePatch(project, patch.changes);
  const backupDir = path.join(project.path, ".chatgpt-codex", "patch-backups", patch.id);
  fs.mkdirSync(backupDir, { recursive: true });
  const applied: Array<{ filePath: string; backupPath?: string; mode: string }> = [];
  for (const change of changes) {
    const target = resolveProjectFile(project, change.filePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    let backupPath: string | undefined;
    if (fs.existsSync(target)) {
      backupPath = path.join(backupDir, change.filePath.replace(/[\\/]/g, "__"));
      fs.copyFileSync(target, backupPath);
    }
    fs.writeFileSync(target, change.content, "utf8");
    applied.push({ filePath: change.filePath, backupPath, mode: change.mode });
  }
  const metadataPath = path.join(project.path, ".chatgpt-codex", "patch-backups", patch.id, "metadata.json");
  fs.writeFileSync(metadataPath, JSON.stringify({ patchId: patch.id, appliedAt: now(), applied }, null, 2));
  return { applied, metadataPath };
}

function readPatchBackupMetadata(project: Project, patchId: string): any | null {
  const metadataPath = path.join(project.path, ".chatgpt-codex", "patch-backups", patchId, "metadata.json");
  return readJson(metadataPath);
}

function revertWebPatch(patch: WebPatch, project: Project) {
  const metadata = readPatchBackupMetadata(project, patch.id);
  if (!metadata || !Array.isArray(metadata.applied)) throw new Error("patch backup metadata not found; cannot safely revert");
  const reverted: Array<{ filePath: string; action: string }> = [];
  for (const item of metadata.applied.slice().reverse()) {
    const filePath = assertSafeRelativePath(item.filePath);
    const target = resolveProjectFile(project, filePath);
    if (item.backupPath && fs.existsSync(item.backupPath)) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(item.backupPath, target);
      reverted.push({ filePath, action: "restored_backup" });
    } else if (fs.existsSync(target)) {
      fs.unlinkSync(target);
      reverted.push({ filePath, action: "removed_created_file" });
    } else {
      reverted.push({ filePath, action: "already_missing" });
    }
  }
  return { reverted, metadata };
}

function buildUnifiedDiff(filePath: string, before: string, after: string): string {
  if (before === after) return `--- a/${filePath}\n+++ b/${filePath}\n(no changes)\n`;
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const max = Math.max(beforeLines.length, afterLines.length);
  const out = [`--- a/${filePath}`, `+++ b/${filePath}`, "@@ simplified-diff @@"];
  for (let i = 0; i < max; i += 1) {
    const a = beforeLines[i];
    const b = afterLines[i];
    if (a === b) {
      if (a !== undefined) out.push(` ${a}`);
    } else {
      if (a !== undefined) out.push(`-${a}`);
      if (b !== undefined) out.push(`+${b}`);
    }
  }
  return out.join("\n");
}

function diffWebPatch(patch: WebPatch, project: Project) {
  const files = patch.changes.map((change) => {
    const target = resolveProjectFile(project, change.filePath);
    const current = fs.existsSync(target) && fs.statSync(target).isFile() ? fs.readFileSync(target, "utf8") : "";
    let before = current;
    if (patch.status === "applied") {
      const metadata = readPatchBackupMetadata(project, patch.id);
      const applied = Array.isArray(metadata?.applied) ? metadata.applied.find((item: any) => item.filePath === change.filePath) : null;
      if (applied?.backupPath && fs.existsSync(applied.backupPath)) before = fs.readFileSync(applied.backupPath, "utf8");
      else before = "";
    }
    return {
      filePath: change.filePath,
      mode: change.mode,
      diff: buildUnifiedDiff(change.filePath, before, change.content)
    };
  });
  return { patchId: patch.id, status: patch.status, files };
}

function createApprovalRequest(jobId: string, method: string, params: unknown): ApprovalRequest {
  const state = loadState();
  const request: ApprovalRequest = {
    id: nanoid(10),
    jobId,
    method,
    params: compactForLog(params, 10000),
    status: "pending",
    expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    events: [{ at: now(), type: "approval_requested", message: `Codex requested approval for ${method}.` }],
    createdAt: now(),
    updatedAt: now()
  };
  state.approvalRequests.push(request);
  saveState(state);
  writeLog("warn", "codex.approval", "Codex app-server requested approval", { approvalId: request.id, jobId, method });
  return request;
}

function resolveApprovalDecision(approvalId: string, timeoutMs = 2 * 60 * 1000): Promise<"accept" | "decline" | "cancel"> {
  const started = Date.now();
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const state = loadState();
      const request = state.approvalRequests.find((item) => item.id === approvalId);
      if (!request) {
        clearInterval(interval);
        resolve("decline");
        return;
      }
      if (request.status === "approved") {
        clearInterval(interval);
        resolve(request.decision || "accept");
        return;
      }
      if (request.status === "declined") {
        clearInterval(interval);
        resolve(request.decision || "decline");
        return;
      }
      if (Date.now() - started > timeoutMs) {
        request.status = "expired";
        request.decision = "decline";
        request.updatedAt = now();
        request.events.push({ at: now(), type: "approval_expired", message: "Approval timed out; defaulting to decline." });
        saveState(state);
        clearInterval(interval);
        resolve("decline");
      }
    }, 500);
  });
}

function findProjectByOptionalId(state: State, projectId?: string): Project | undefined {
  if (!projectId) return state.projects[0];
  return state.projects.find((project) => project.id === projectId);
}

function buildRepairCodexTask(proposal: RepairProposal): string {
  return [
    "Apply the approved repair proposal below. Keep the fix minimal and verify with the smallest relevant check.",
    `Source: ${proposal.sourceKind}`,
    proposal.sourceRequestId ? `Request ID: ${proposal.sourceRequestId}` : "",
    proposal.sourceLogId ? `Log ID: ${proposal.sourceLogId}` : "",
    "",
    "Error summary:",
    proposal.errorSummary,
    "",
    "Diagnosis:",
    proposal.conciseDiagnosis,
    "",
    "Approved solution:",
    proposal.solution,
    "",
    "Execution plan:",
    ...proposal.executionPlan.map((step, idx) => `${idx + 1}. ${step}`),
    "",
    proposal.codexTask || "Implement the minimal safe repair described above."
  ].filter(Boolean).join("\n");
}

type TaskTemplate = { id: string; title: string; category: string; roles: string[]; safetyLevel: number; prompt: string };

const TASK_TEMPLATES: TaskTemplate[] = [
  { id: "ui-polish", title: "UI polish and accessibility pass", category: "frontend", roles: ["ui_ux_designer", "frontend_engineer", "qa_reviewer"], safetyLevel: 2, prompt: "Review the selected UI files, improve visual hierarchy, loading/error/empty states, keyboard accessibility, responsive behavior, and keep the diff small. Run the smallest relevant checks." },
  { id: "bug-fix", title: "Focused bug fix", category: "debugging", roles: ["debugger", "qa_reviewer"], safetyLevel: 2, prompt: "Reproduce or reason through the reported bug, identify the minimal root cause, apply the smallest safe fix, and verify with targeted tests or a clear manual check." },
  { id: "test-triage", title: "Test failure triage", category: "qa", roles: ["debugger", "qa_reviewer"], safetyLevel: 2, prompt: "Run or inspect the failing tests, classify failures as product bug, test bug, environment issue, or dependency issue, then apply the minimal safe fix and report exact commands." },
  { id: "api-endpoint", title: "Backend API endpoint implementation", category: "backend", roles: ["backend_engineer", "security_reviewer", "qa_reviewer"], safetyLevel: 3, prompt: "Implement the requested API endpoint with validation, error handling, auth assumptions, logging, tests, and migration caution. Do not touch production data or secrets." },
  { id: "release-check", title: "Pre-release review", category: "release", roles: ["release_manager", "qa_reviewer", "security_reviewer"], safetyLevel: 2, prompt: "Perform a release readiness pass: changed files, commands run, tests, risk notes, rollback notes, and a PR description. Avoid large unrelated refactors." },
  { id: "web-patch-review", title: "Review ChatGPT-authored patch", category: "review", roles: ["frontend_engineer", "qa_reviewer", "security_reviewer"], safetyLevel: 2, prompt: "Review the ChatGPT Web-authored patch against repository conventions, run the smallest relevant checks, fix integration issues if safe, and report whether to keep, modify, or revert." }
];

function inferTestPlan(project: Project) {
  const pkg = readJson(path.join(project.path, "package.json")) as any;
  const scripts = pkg && typeof pkg === "object" && pkg.scripts && typeof pkg.scripts === "object" ? pkg.scripts : {};
  const preferred = ["lint", "typecheck", "test", "build", "format:check", "check"].filter((name) => scripts[name]);
  const commands = preferred.map((name) => ({ name, command: `npm run ${name}`, script: scripts[name] }));
  const fallback = Object.keys(scripts).slice(0, 10).map((name) => ({ name, command: `npm run ${name}`, script: scripts[name] }));
  return { packageManager: fs.existsSync(path.join(project.path, "pnpm-lock.yaml")) ? "pnpm" : fs.existsSync(path.join(project.path, "yarn.lock")) ? "yarn" : "npm", scripts, recommended: commands.length ? commands : fallback, note: "These commands are inferred from package.json only. Let Codex choose the smallest safe verification command for the task." };
}

async function buildContextPack(project: Project, options: { paths: string[]; includeTree: boolean; includeGitStatus: boolean; includeDiff: boolean; includeRoles: boolean; includeSkills: boolean; notes?: string }) {
  const packId = nanoid(10);
  const tree = options.includeTree ? walkFiles(project.path, "", 500) : [];
  const files = Array.from(new Set(options.paths)).slice(0, 30).map((filePath) => readProjectFile(project, filePath, MAX_FILE_BYTES));
  const gitStatus = options.includeGitStatus ? await runGit(project, ["status", "--short", "--branch"]) : null;
  const gitDiff = options.includeDiff ? await runGit(project, ["diff", "--"]) : null;
  const roles = options.includeRoles ? listMarkdownFiles(ROLE_DIR) : [];
  const skills = options.includeSkills ? listSkillFolders(SKILL_DIR) : [];
  const lines: string[] = [];
  lines.push(`# Context Pack ${packId}`);
  lines.push("");
  lines.push(`Project: ${project.name}`);
  lines.push(`Path: ${project.path}`);
  if (options.notes) lines.push(`Notes: ${options.notes}`);
  lines.push("");
  if (tree.length) { lines.push("## Tree"); lines.push("```text"); lines.push(...tree.map((entry) => `${entry.type === "dir" ? "[d]" : "[f]"} ${entry.path}${entry.size ? ` (${entry.size}b)` : ""}`)); lines.push("```"); lines.push(""); }
  if (gitStatus) { lines.push("## Git status"); lines.push("```text"); lines.push(gitStatus.stdout || gitStatus.stderr || ""); lines.push("```"); lines.push(""); }
  if (gitDiff) { lines.push("## Git diff preview"); lines.push("```diff"); lines.push((gitDiff.stdout || gitDiff.stderr || "").slice(0, 20000)); lines.push("```"); lines.push(""); }
  if (roles.length) { lines.push("## Available role protocols"); lines.push(...roles.map((role) => `- ${role.id}: ${role.name}`)); lines.push(""); }
  if (skills.length) { lines.push("## Available Codex skills"); lines.push(...skills.map((skill) => `- ${skill.id}`)); lines.push(""); }
  if (files.length) {
    lines.push("## Selected files");
    for (const file of files) {
      lines.push(`### ${file.path}`);
      lines.push("```text");
      lines.push(file.content);
      lines.push("```");
      lines.push("");
    }
  }
  const markdown = lines.join("\n");
  const dir = path.join(dataDir, "context-packs");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${packId}.md`);
  fs.writeFileSync(filePath, markdown, "utf8");
  writeLog("info", "context_pack", "Context pack created", { packId, projectId: project.id, files: files.map((file) => file.path) });
  return { id: packId, projectId: project.id, filePath, markdown, summary: { files: files.length, treeEntries: tree.length, includesGitStatus: !!gitStatus, includesDiff: !!gitDiff, roles: roles.length, skills: skills.length } };
}


function readJson(filePath: string): unknown | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function filePreview(filePath: string, max = 4000): string | null {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile() || stat.size > 1024 * 1024) return null;
    return fs.readFileSync(filePath, "utf8").slice(0, max);
  } catch {
    return null;
  }
}

function inspectProject(project: Project) {
  const entries = fs
    .readdirSync(project.path, { withFileTypes: true })
    .filter((entry) => !["node_modules", ".git", "dist", "build", ".next"].includes(entry.name))
    .slice(0, 120)
    .map((entry) => ({ name: entry.name, type: entry.isDirectory() ? "dir" : "file" }));

  const packageJson = readJson(path.join(project.path, "package.json"));
  const pyproject = filePreview(path.join(project.path, "pyproject.toml"), 2000);
  const readme = ["README.md", "readme.md", "README.MD"]
    .map((file) => path.join(project.path, file))
    .find(fs.existsSync);
  const agents = filePreview(path.join(project.path, "AGENTS.md"), 4000);

  return {
    project,
    entries,
    packageJson,
    pyprojectPreview: pyproject,
    agentsPreview: agents,
    readmePreview: readme ? filePreview(readme, 5000) : null
  };
}

function listMarkdownFiles(dir: string): Array<{ id: string; name: string; path: string; preview: string | null }> {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      const fullPath = path.join(dir, entry.name);
      return {
        id: path.basename(entry.name, ".md"),
        name: entry.name,
        path: fullPath,
        preview: filePreview(fullPath, 1200)
      };
    });
}

function listSkillFolders(dir: string): Array<{ id: string; path: string; skillMd: string; frontmatter: string | null }> {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      const skillMd = path.join(dir, entry.name, "SKILL.md");
      const content = filePreview(skillMd, 2000) || "";
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      return {
        id: entry.name,
        path: path.join(dir, entry.name),
        skillMd,
        frontmatter: match ? match[1] : null
      };
    });
}

function buildCodexPrompt(job: Pick<Job, "title" | "task" | "roles" | "safetyLevel">, project: Project): string {
  const roleBlock = job.roles.length
    ? job.roles.map((role) => `- ${role}`).join("\n")
    : "- No explicit role protocol selected. Infer minimal implementation skills.";

  return [
    "You are Codex, the implementation agent. ChatGPT has already acted as the project orchestrator.",
    "Do not redo product planning unless the implementation task is ambiguous.",
    "Use repository conventions, AGENTS.md, and relevant .agents/skills.",
    "Prefer small, reviewable diffs. Do not push, deploy, migrate production data, or install dependencies without approval.",
    "",
    `Project: ${project.name}`,
    `Project path: ${project.path}`,
    `Task title: ${job.title}`,
    `Safety level: ${job.safetyLevel}`,
    "Selected role protocols:",
    roleBlock,
    "",
    "Task:",
    job.task,
    "",
    "Return this structure:",
    "1. changed_files",
    "2. diff_summary",
    "3. commands_run",
    "4. test_results",
    "5. risks_or_blockers",
    "6. recommended_next_step"
  ].join("\n");
}

function buildSandboxPolicy(project: Project, settings: BridgeSettings = currentSettings()) {
  if (settings.codexSandboxMode === "readOnly") {
    return { type: "readOnly", access: { type: "restricted", includePlatformDefaults: true, readableRoots: [project.path] } };
  }
  if (settings.codexSandboxMode === "dangerFullAccess") {
    return { type: "dangerFullAccess" };
  }
  return {
    type: "workspaceWrite",
    writableRoots: [project.path],
    readOnlyAccess: { type: "restricted", includePlatformDefaults: true, readableRoots: [project.path] },
    networkAccess: settings.networkAccess
  };
}

function runCodexAppServer(job: Job, project: Project): Promise<Pick<Job, "stdout" | "stderr" | "exitCode" | "result"> & { codexThreadId?: string; codexTurnId?: string }> {
  const settings = currentSettings();
  return new Promise((resolve) => {
    const child = spawn(CODEX_BIN, ["app-server"], {
      cwd: project.path,
      env: process.env,
      shell: false,
      stdio: ["pipe", "pipe", "pipe"]
    });

    const rl = readline.createInterface({ input: child.stdout });
    let stdout = "";
    let stderr = "";
    let agentText = "";
    let latestDiff = "";
    let msgId = 1;
    let threadId: string | undefined;
    let turnId: string | undefined;
    const pending = new Map<number, { resolve: (value: any) => void; reject: (err: Error) => void }>();
    let finished = false;

    function sendRaw(message: unknown) {
      child.stdin.write(`${JSON.stringify(message)}\n`);
    }

    function request(method: string, params: Record<string, unknown> = {}) {
      const id = msgId++;
      sendRaw({ method, id, params });
      return new Promise<any>((resolveRequest, rejectRequest) => pending.set(id, { resolve: resolveRequest, reject: rejectRequest }));
    }

    function notify(method: string, params: Record<string, unknown> = {}) {
      sendRaw({ method, params });
    }

    function finish(exitCode: number | null, result: string) {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      try { child.stdin.end(); } catch {}
      try { child.kill(); } catch {}
      resolve({ stdout, stderr, exitCode, result, codexThreadId: threadId, codexTurnId: turnId });
    }

    const timeout = setTimeout(() => {
      appendJobEvent(job.id, "app_server_timeout", `Codex app-server timed out after ${CODEX_JOB_TIMEOUT_MS}ms.`);
      finish(124, agentText || latestDiff || stdout || stderr || "Codex app-server timed out.");
    }, CODEX_JOB_TIMEOUT_MS);

    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (err) => finish(1, `Codex app-server failed to start: ${err.message}`));
    child.on("close", (code) => {
      if (!finished) finish(code, agentText || latestDiff || stdout || stderr || `Codex app-server exited with ${code}.`);
    });

    rl.on("line", (line) => {
      stdout += line + "\n";
      let msg: any;
      try { msg = JSON.parse(line); } catch { return; }

      if (typeof msg.id === "number" && pending.has(msg.id)) {
        const entry = pending.get(msg.id)!;
        pending.delete(msg.id);
        if (msg.error) entry.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else entry.resolve(msg.result);
        return;
      }

      if (msg.method) {
        appendJobEvent(job.id, "app_server_event", msg.method, compactForLog(msg.params));
        if (msg.method === "thread/started") threadId = msg.params?.thread?.id || threadId;
        if (msg.method === "turn/started") turnId = msg.params?.turn?.id || turnId;
        if (msg.method === "turn/diff/updated") latestDiff = msg.params?.diff || latestDiff;
        if (msg.method === "item/agentMessage/delta") agentText += msg.params?.delta || msg.params?.text || "";
        if (msg.method === "item/completed" && msg.params?.item?.type === "agentMessage" && msg.params?.item?.text) {
          agentText += `
${msg.params.item.text}`;
        }
        if (msg.method === "turn/completed") {
          const status = msg.params?.turn?.status || "completed";
          const errorText = msg.params?.turn?.error?.message;
          finish(status === "completed" ? 0 : 1, agentText || latestDiff || errorText || `Codex turn ${status}.`);
        }

        if (typeof msg.id === "number" && String(msg.method).includes("requestApproval")) {
          if (settings.appServerApprovalResponse === "accept" || settings.appServerApprovalResponse === "decline") {
            const decision = settings.appServerApprovalResponse === "accept" ? "accept" : "decline";
            sendRaw({ id: msg.id, result: { decision } });
            appendJobEvent(job.id, "app_server_approval_auto_response", `Responded to ${msg.method} with ${decision}.`);
          } else {
            const approval = createApprovalRequest(job.id, msg.method, msg.params);
            appendJobEvent(job.id, "app_server_approval_pending", `Waiting for dashboard approval ${approval.id}.`, { approvalId: approval.id });
            resolveApprovalDecision(approval.id).then((decision) => {
              sendRaw({ id: msg.id, result: { decision } });
              appendJobEvent(job.id, "app_server_approval_user_response", `Responded to ${msg.method} with ${decision}.`, { approvalId: approval.id });
            }).catch(() => {
              sendRaw({ id: msg.id, result: { decision: "decline" } });
            });
          }
        }
      }
    });

    (async () => {
      try {
        await request("initialize", {
          clientInfo: { name: "chatgpt_codex_orchestrator_bridge", title: "ChatGPT Codex Orchestrator Bridge", version: VERSION },
          capabilities: { experimentalApi: true }
        });
        notify("initialized", {});
        const threadParams: Record<string, unknown> = {
          cwd: project.path,
          approvalPolicy: settings.codexApprovalPolicy,
          sandboxPolicy: buildSandboxPolicy(project, settings),
          personality: "neutral",
          serviceName: "chatgpt_codex_orchestrator"
        };
        if (CODEX_APP_SERVER_MODEL) threadParams.model = CODEX_APP_SERVER_MODEL;
        const thread = await request("thread/start", threadParams);
        threadId = thread?.thread?.id;
        const turnParams: Record<string, unknown> = {
          threadId,
          cwd: project.path,
          input: [{ type: "text", text: job.codexPrompt }],
          approvalPolicy: settings.codexApprovalPolicy,
          sandboxPolicy: buildSandboxPolicy(project, settings),
          summary: "concise"
        };
        if (CODEX_APP_SERVER_MODEL) turnParams.model = CODEX_APP_SERVER_MODEL;
        const turn = await request("turn/start", turnParams);
        turnId = turn?.turn?.id;
        appendJobEvent(job.id, "app_server_turn_started", "Codex app-server turn started.", { threadId, turnId });
      } catch (err) {
        finish(1, err instanceof Error ? err.message : String(err));
      }
    })();
  });
}

function readCodexAccountViaAppServer(): Promise<{ stdout: string; stderr: string; exitCode: number | null; account?: unknown; rateLimits?: unknown; error?: string }> {
  return new Promise((resolve) => {
    const child = spawn(CODEX_BIN, ["app-server"], { env: process.env, shell: false, stdio: ["pipe", "pipe", "pipe"] });
    const rl = readline.createInterface({ input: child.stdout });
    let stdout = "";
    let stderr = "";
    let msgId = 1;
    const pending = new Map<number, { resolve: (value: any) => void; reject: (err: Error) => void }>();
    let done = false;
    function sendRaw(message: unknown) { child.stdin.write(`${JSON.stringify(message)}\n`); }
    function request(method: string, params: Record<string, unknown> = {}) {
      const id = msgId++;
      sendRaw({ method, id, params });
      return new Promise<any>((resolveRequest, rejectRequest) => pending.set(id, { resolve: resolveRequest, reject: rejectRequest }));
    }
    function notify(method: string, params: Record<string, unknown> = {}) { sendRaw({ method, params }); }
    function finish(payload: any) {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      try { child.stdin.end(); } catch {}
      try { child.kill(); } catch {}
      resolve(payload);
    }
    const timeout = setTimeout(() => finish({ stdout, stderr, exitCode: 124, error: "account read timed out" }), 30_000);
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (err) => finish({ stdout, stderr: stderr + `\n${err.message}`, exitCode: 1, error: err.message }));
    child.on("close", (code) => { if (!done) finish({ stdout, stderr, exitCode: code, error: `codex app-server exited with ${code}` }); });
    rl.on("line", (line) => {
      stdout += line + "\n";
      let msg: any;
      try { msg = JSON.parse(line); } catch { return; }
      if (typeof msg.id === "number" && pending.has(msg.id)) {
        const entry = pending.get(msg.id)!;
        pending.delete(msg.id);
        if (msg.error) entry.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else entry.resolve(msg.result);
      }
    });
    (async () => {
      try {
        await request("initialize", { clientInfo: { name: "chatgpt_codex_orchestrator_bridge", title: "ChatGPT Codex Orchestrator Bridge", version: VERSION } });
        notify("initialized", {});
        const account = await request("account/read", { refreshToken: false }).catch((err) => ({ error: err.message }));
        const rateLimits = await request("account/rateLimits/read", {}).catch((err) => ({ error: err.message }));
        finish({ stdout, stderr, exitCode: 0, account, rateLimits });
      } catch (err) {
        finish({ stdout, stderr, exitCode: 1, error: err instanceof Error ? err.message : String(err) });
      }
    })();
  });
}

function runCodexCli(job: Job, project: Project): Promise<Pick<Job, "stdout" | "stderr" | "exitCode" | "result">> {
  return new Promise((resolve) => {
    const child = spawn(CODEX_BIN, [...CODEX_ARGS, job.codexPrompt], {
      cwd: project.path,
      env: process.env,
      shell: false
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      resolve({ stdout, stderr: stderr + `\n${err.message}`, exitCode: 1, result: "Codex CLI failed to start." });
    });
    child.on("close", (code) => {
      resolve({ stdout, stderr, exitCode: code, result: stdout || stderr });
    });
  });
}

async function runJob(jobId: string): Promise<Job> {
  let snapshot: Job | undefined;
  const state = loadState();
  const job = state.jobs.find((j) => j.id === jobId);
  if (!job) throw new Error("job not found");
  const project = state.projects.find((p) => p.id === job.projectId);
  if (!project) throw new Error("project not found");
  const settings = state.settings;
  const executionMode = currentExecution();
  if (!["queued", "needs_approval"].includes(job.status)) throw new Error(`job cannot run from status ${job.status}`);
  if (job.requiresApproval && !job.approvedAt) throw new Error("job requires approval before execution");
  if (settings.permissionMode === "read_only" && executionMode === "cli") throw new Error("read_only mode cannot safely run cli because CLI sandbox settings are not enforced by this bridge; use app-server or dry-run");

  job.status = "running";
  job.events.push({ at: now(), type: "run_started", message: `Execution mode: ${executionMode}; permission mode: ${settings.permissionMode}` });
  writeLog("info", "codex.job", "Job run started", { jobId, execution: executionMode, permissionMode: settings.permissionMode, projectId: project.id });
  job.updatedAt = now();
  saveState(state);
  snapshot = job;

  try {
    if (executionMode === "dry-run") {
      snapshot = updateJob(jobId, (j) => {
        j.status = "completed";
        j.result = "Dry run only. Codex was not executed. Switch execution mode in Dashboard > Settings or copy codexPrompt into Codex.";
        j.events.push({ at: now(), type: "dry_run_completed", message: "No code was changed." });
        writeLog("info", "codex.job", "Dry-run job completed", { jobId });
      });
      return snapshot;
    }

    if (!["cli", "app-server"].includes(executionMode)) throw new Error(`unsupported execution mode: ${executionMode}`);
    const execution = executionMode === "app-server" ? await runCodexAppServer(snapshot, project) : await runCodexCli(snapshot, project);
    snapshot = updateJob(jobId, (j) => {
      j.stdout = execution.stdout;
      j.stderr = execution.stderr;
      j.exitCode = execution.exitCode;
      j.result = execution.result;
      if ("codexThreadId" in execution && execution.codexThreadId) j.events.push({ at: now(), type: "app_server_thread", message: `Thread ${execution.codexThreadId}`, data: { threadId: execution.codexThreadId, turnId: (execution as any).codexTurnId } });
      j.status = execution.exitCode === 0 ? "completed" : "failed";
      j.events.push({ at: now(), type: "run_finished", message: `Codex exited with ${execution.exitCode}` });
      writeLog(execution.exitCode === 0 ? "info" : "error", "codex.job", "Job run finished", { jobId, exitCode: execution.exitCode, status: j.status });
    });
    return snapshot;
  } catch (err) {
    snapshot = updateJob(jobId, (j) => {
      j.status = "failed";
      j.error = err instanceof Error ? err.message : String(err);
      j.events.push({ at: now(), type: "run_failed", message: j.error || "unknown error" });
      writeLog("error", "codex.job", "Job run failed", { jobId, error: j.error });
    });
    return snapshot;
  }
}

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = nanoid(8);
  (req as Request & { requestId?: string }).requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  const started = Date.now();
  res.on("finish", () => {
    try {
      const settings = currentSettings();
      if (res.statusCode >= 400 || settings.logLevel === "debug") {
        writeLog(res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "debug", "http", `${req.method} ${req.path} -> ${res.statusCode}`, { durationMs: Date.now() - started }, requestId);
      }
    } catch {
      // Logging must not affect request handling.
    }
  });
  next();
});

app.use(auth);

app.get("/bootstrap", (req, res) => {
  if (!isLoopbackRequest(req)) {
    res.status(403).json({ error: "bootstrap is only available from the local machine" });
    return;
  }
  const runtime = loadRuntime();
  const settings = currentSettings();
  const host = req.get("host") || `localhost:${PORT}`;
  res.json({
    ok: true,
    baseUrl: `${req.protocol}://${host}`,
    token: runtime.token,
    tokenPreview: tokenPreview(runtime.token),
    execution: runtime.execution,
    permissionMode: settings.permissionMode,
    version: VERSION,
    note: "Local bootstrap is intended for the dashboard on this machine. Sensitive API routes still require Authorization."
  });
});

app.get("/health", (_req, res) => {
  const settings = currentSettings();
  res.json({
    ok: true,
    execution: currentExecution(),
    version: VERSION,
    permissionMode: settings.permissionMode,
    supports: { cli: true, appServer: true, externalOutputMirror: true, crossReview: true, accessModes: true, logs: true, patchDiff: true, patchRevert: true, appServerApprovalQueue: true, githubSync: true, uiScreenshotReview: true, repairProposals: true, contextPacks: true, taskTemplates: true, exportState: true, supportBundle: true, testPlan: true }
  });
});

app.get("/roles", (_req, res) => res.json({ roles: listMarkdownFiles(ROLE_DIR) }));

app.get("/skills", (_req, res) => res.json({ skills: listSkillFolders(SKILL_DIR) }));

app.get("/config", (_req, res) => {
  const state = loadState();
  const runtime = loadRuntime();
  res.json({ settings: state.settings, execution: runtime.execution, tokenPreview: tokenPreview(runtime.token), version: VERSION, logDir: path.join(dataDir, "logs") });
});

app.post("/config/runtime", (req, res) => {
  const schema = z.object({
    token: z.string().trim().min(3).max(200).optional(),
    execution: executionModeSchema.optional(),
    regenerateToken: z.boolean().default(false)
  });
  const body = schema.parse(req.body || {});
  const previous = loadRuntime();
  const nextToken = body.regenerateToken ? generateLocalToken() : body.token || previous.token;
  const runtime = saveRuntime({
    ...previous,
    token: nextToken,
    execution: body.execution || previous.execution,
    updatedAt: now()
  });
  writeLog("warn", "config", "Runtime settings changed from dashboard", { execution: runtime.execution, tokenChanged: Boolean(body.token || body.regenerateToken), tokenRegenerated: body.regenerateToken, tokenPreview: tokenPreview(runtime.token) }, (req as Request & { requestId?: string }).requestId);
  res.json({
    ok: true,
    execution: runtime.execution,
    token: body.regenerateToken ? runtime.token : undefined,
    tokenPreview: tokenPreview(runtime.token),
    settings: currentSettings(),
    note: "Runtime settings updated. Future requests must use the current token."
  });
});

app.post("/config/access-mode", (req, res) => {
  const schema = z.object({
    permissionMode: permissionModeSchema,
    confirmFullAccess: z.string().optional(),
    logLevel: z.enum(["info", "debug"]).optional()
  });
  const body = schema.parse(req.body || {});
  if (body.permissionMode === "full_access" && !["I understand", "我已理解风险"].includes(body.confirmFullAccess || "")) {
    throw new Error('full_access requires confirmFullAccess: "I understand" or "我已理解风险"');
  }
  const state = loadState();
  state.settings = settingsForMode(body.permissionMode);
  if (body.logLevel) state.settings.logLevel = body.logLevel;
  saveState(state);
  writeLog("warn", "config", `Permission mode changed to ${body.permissionMode}`, { settings: state.settings }, (req as Request & { requestId?: string }).requestId);
  res.json({ settings: state.settings, note: "Mode changed. New Codex jobs will use this mode." });
});

app.get("/logs", (req, res) => {
  const limit = Math.max(1, Math.min(500, Number(req.query.limit || 100)));
  const level = typeof req.query.level === "string" ? req.query.level : undefined;
  res.json({ logs: readRecentLogs(limit, level) });
});

app.post("/logs/clear", (_req, res) => {
  const dir = path.join(dataDir, "logs");
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith(".jsonl")) fs.unlinkSync(path.join(dir, file));
    }
  }
  res.json({ ok: true, note: "Log files cleared." });
});

app.get("/diagnostics", (_req, res) => {
  const state = loadState();
  const errors = readRecentLogs(20, "error");
  res.json({
    ok: true,
    version: VERSION,
    execution: currentExecution(),
    settings: state.settings,
    counts: { projects: state.projects.length, jobs: state.jobs.length, webPatches: state.webPatches.length, reviews: state.reviewSessions.length, approvals: state.approvalRequests.length, repairs: state.repairProposals.length, errors: errors.length },
    paths: { dataDir, stateFile, logDir: path.join(dataDir, "logs"), roleDir: ROLE_DIR, skillDir: SKILL_DIR },
    recentErrors: errors
  });
});

app.get("/task-templates", (_req, res) => {
  res.json({ templates: TASK_TEMPLATES });
});

app.get("/export/state", (_req, res) => {
  const state = loadState();
  const safeState = {
    ...state,
    projects: state.projects.map((project) => ({ ...project, path: project.path })),
    exportedAt: now(),
    version: VERSION
  };
  res.json(safeState);
});

app.get("/support-bundle", (_req, res) => {
  const state = loadState();
  const errors = readRecentLogs(50, "error");
  const warnings = readRecentLogs(50, "warn");
  res.json({
    generatedAt: now(),
    version: VERSION,
    execution: currentExecution(),
    settings: state.settings,
    counts: { projects: state.projects.length, jobs: state.jobs.length, webPatches: state.webPatches.length, reviews: state.reviewSessions.length, approvals: state.approvalRequests.length, repairs: state.repairProposals.length },
    recentErrors: errors,
    recentWarnings: warnings,
    note: "This bundle is safe for troubleshooting after reviewing project paths and error text. It does not include file contents unless logs contain them."
  });
});

app.get("/context-packs/:id", (req, res) => {
  const filePath = path.join(dataDir, "context-packs", `${assertSafeRelativePath(req.params.id)}.md`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "context pack not found" });
  res.type("text/markdown").send(fs.readFileSync(filePath, "utf8"));
});

app.get("/projects", (_req, res) => {
  const state = loadState();
  res.json({ projects: state.projects });
});

app.post("/projects", (req, res) => {
  const schema = z.object({ name: z.string().min(1), path: z.string().min(1), allowShell: z.boolean().default(false) });
  const body = schema.parse(req.body);
  const resolvedPath = safeProjectPath(body.path);
  const state = loadState();
  const existing = state.projects.find((project) => project.path === resolvedPath);
  if (existing) return res.status(200).json({ project: existing, note: "project already registered" });
  const project: Project = {
    id: nanoid(10),
    name: body.name,
    path: resolvedPath,
    allowShell: body.allowShell,
    createdAt: now(),
    updatedAt: now()
  };
  state.projects.push(project);
  saveState(state);
  res.status(201).json({ project });
});

app.get("/projects/:id/inspect", (req, res) => {
  const state = loadState();
  const project = state.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "project not found" });
  res.json(inspectProject(project));
});

app.get("/projects/:id/tree", (req, res) => {
  const state = loadState();
  const project = state.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "project not found" });
  const limit = Number(req.query.limit || 250);
  res.json({ projectId: project.id, root: project.path, entries: walkFiles(project.path, "", Math.min(limit, 1000)) });
});

app.get("/projects/:id/files/read", (req, res) => {
  const state = loadState();
  const project = state.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "project not found" });
  const filePath = String(req.query.path || "");
  res.json({ file: readProjectFile(project, filePath) });
});

app.post("/projects/:id/snapshot", (req, res) => {
  const schema = z.object({
    paths: z.array(z.string()).default([]),
    includeTree: z.boolean().default(true),
    maxFiles: z.number().int().min(1).max(80).default(MAX_SNAPSHOT_FILES)
  });
  const body = schema.parse(req.body || {});
  const state = loadState();
  const project = state.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "project not found" });
  const uniquePaths = Array.from(new Set(body.paths as string[])).slice(0, body.maxFiles);
  const files = uniquePaths.map((filePath: string) => readProjectFile(project, filePath));
  res.json({
    project: inspectProject(project),
    tree: body.includeTree ? walkFiles(project.path, "", 300) : [],
    files,
    note: "This context pack is intended for ChatGPT Web to write or review small targeted patches. Use Codex for repository-wide edits and test execution."
  });
});

app.post("/projects/:id/context-pack", async (req, res) => {
  const schema = z.object({
    paths: z.array(z.string()).default([]),
    includeTree: z.boolean().default(true),
    includeGitStatus: z.boolean().default(true),
    includeDiff: z.boolean().default(false),
    includeRoles: z.boolean().default(true),
    includeSkills: z.boolean().default(true),
    notes: z.string().optional()
  });
  const body = schema.parse(req.body || {});
  const state = loadState();
  const project = state.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "project not found" });
  const pack = await buildContextPack(project, body);
  res.status(201).json({ pack: { id: pack.id, projectId: pack.projectId, filePath: pack.filePath, summary: pack.summary }, markdown: pack.markdown });
});

app.get("/projects/:id/test-plan", (req, res) => {
  const state = loadState();
  const project = state.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "project not found" });
  res.json({ projectId: project.id, testPlan: inferTestPlan(project) });
});

app.post("/projects/:id/test-job", (req, res) => {
  const schema = z.object({ scope: z.string().default("Run the smallest relevant checks for the current changes."), runImmediately: z.boolean().default(false) });
  const body = schema.parse(req.body || {});
  const state = loadState();
  const project = state.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "project not found" });
  const testPlan = inferTestPlan(project);
  const task = [
    "Verify the current project state after ChatGPT/Codex changes.",
    body.scope,
    "",
    "Inferred commands:",
    ...testPlan.recommended.map((cmd: any) => `- ${cmd.command}: ${cmd.script}`),
    "",
    "Run the smallest safe checks first. If a check fails, diagnose briefly and either fix the minimal issue or create a concise blocker report."
  ].join("\n");
  const requiresApproval = requiresApprovalForJob(2, state.settings);
  const job: Job = {
    id: nanoid(10), projectId: project.id, title: "Verification job", task, roles: ["qa_reviewer", "debugger"], status: requiresApproval ? "needs_approval" : "queued", safetyLevel: 2, requiresApproval,
    codexPrompt: buildCodexPrompt({ title: "Verification job", task, roles: ["qa_reviewer", "debugger"], safetyLevel: 2 }, project),
    events: [{ at: now(), type: "verification_job_created", message: "Created verification job from inferred test plan." }], createdAt: now(), updatedAt: now()
  };
  state.jobs.push(job);
  saveState(state);
  res.status(201).json({ job, testPlan });
});

app.get("/projects/:id/git/status", async (req, res) => {
  const state = loadState();
  const project = state.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "project not found" });
  const status = await runGit(project, ["status", "--short", "--branch"]);
  res.json(status);
});

app.get("/projects/:id/git/diff", async (req, res) => {
  const state = loadState();
  const project = state.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "project not found" });
  const cached = String(req.query.cached || "false") === "true";
  const args = cached ? ["diff", "--cached", "--"] : ["diff", "--"];
  const diff = await runGit(project, args);
  res.json(diff);
});


app.get("/projects/:id/git/remotes", async (req, res) => {
  const state = loadState();
  const project = state.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "project not found" });
  const remotes = await runGit(project, ["remote", "-v"]);
  res.json(remotes);
});

app.post("/projects/:id/git/branch", async (req, res) => {
  const schema = z.object({ branchName: z.string().min(1), checkout: z.boolean().default(true), create: z.boolean().default(true) });
  const body = schema.parse(req.body || {});
  const state = loadState();
  const project = state.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "project not found" });
  assertMutationsAllowed(state.settings, "git branch");
  const branch = body.branchName.replace(/[^A-Za-z0-9._\/-]/g, "-");
  const args = body.checkout ? (body.create ? ["checkout", "-b", branch] : ["checkout", branch]) : ["branch", branch];
  const result = await runGit(project, args);
  writeLog(result.exitCode === 0 ? "info" : "error", "git", "Branch command completed", { projectId: project.id, branch, result: compactForLog(result) });
  res.json({ branch, result });
});

app.post("/projects/:id/git/commit", async (req, res) => {
  const schema = z.object({ message: z.string().min(1), addAll: z.boolean().default(false) });
  const body = schema.parse(req.body || {});
  const state = loadState();
  const project = state.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "project not found" });
  assertMutationsAllowed(state.settings, "git commit");
  const add = body.addAll ? await runGit(project, ["add", "-A"]) : { stdout: "", stderr: "", exitCode: 0 };
  if (add.exitCode !== 0) return res.status(400).json({ error: "git add failed", add });
  const commit = await runGit(project, ["commit", "-m", body.message]);
  writeLog(commit.exitCode === 0 ? "info" : "error", "git", "Commit command completed", { projectId: project.id, commit: compactForLog(commit) });
  res.json({ add, commit });
});

app.post("/projects/:id/github/pr", async (req, res) => {
  const schema = z.object({ title: z.string().min(1), body: z.string().default(""), base: z.string().default("main"), draft: z.boolean().default(true) });
  const body = schema.parse(req.body || {});
  const state = loadState();
  const project = state.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "project not found" });
  assertMutationsAllowed(state.settings, "github pr");
  const args = ["pr", "create", "--title", body.title, "--body", body.body || "Created by ChatGPT Codex Orchestrator.", "--base", body.base];
  if (body.draft) args.push("--draft");
  const result = await new Promise<{ stdout: string; stderr: string; exitCode: number | null }>((resolve) => {
    const child = spawn("gh", args, { cwd: project.path, env: process.env, shell: false });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (err) => resolve({ stdout, stderr: stderr + `\n${err.message}`, exitCode: 1 }));
    child.on("close", (code) => resolve({ stdout, stderr, exitCode: code }));
  });
  writeLog(result.exitCode === 0 ? "info" : "error", "github", "PR command completed", { projectId: project.id, result: compactForLog(result) });
  res.json({ result, note: result.exitCode === 0 ? "PR created with GitHub CLI." : "GitHub CLI failed. Confirm gh is installed and authenticated." });
});

app.post("/projects/:id/ui/screenshot-review-job", (req, res) => {
  const schema = z.object({ url: z.string().optional(), notes: z.string().default(""), runCommand: z.string().optional(), screenshotPaths: z.array(z.string()).default([]), runImmediately: z.boolean().default(false) });
  const body = schema.parse(req.body || {});
  const state = loadState();
  const project = state.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "project not found" });
  const task = [
    "Perform a focused UI screenshot review.",
    body.url ? `Target URL: ${body.url}` : "Target URL: not provided; infer local app command if safe.",
    body.runCommand ? `Suggested app command: ${body.runCommand}` : "",
    body.screenshotPaths.length ? `Existing screenshots: ${body.screenshotPaths.join(", ")}` : "",
    body.notes ? `Review notes: ${body.notes}` : "",
    "",
    "Use Playwright or the project test tooling when available. Save screenshot artifacts under .chatgpt-codex/screenshots if you create any. Return concise UI findings: layout, visual hierarchy, accessibility, responsive issues, and recommended minimal fixes."
  ].filter(Boolean).join("\n");
  const requiresApproval = requiresApprovalForJob(2, state.settings);
  const job: Job = {
    id: nanoid(10), projectId: project.id, title: "UI screenshot review", task,
    roles: ["ui_ux_designer", "frontend_engineer", "qa_reviewer"], status: requiresApproval ? "needs_approval" : "queued", safetyLevel: 2, requiresApproval,
    codexPrompt: buildCodexPrompt({ title: "UI screenshot review", task, roles: ["ui_ux_designer", "frontend_engineer", "qa_reviewer"], safetyLevel: 2 }, project),
    events: [{ at: now(), type: "ui_screenshot_review_job_created", message: "Created UI screenshot review job." }], createdAt: now(), updatedAt: now()
  };
  state.jobs.push(job);
  saveState(state);
  res.status(201).json({ job, note: body.runImmediately && !requiresApproval ? "Job queued." : "Approve and run this job from Codex Jobs." });
});

app.get("/web-patches", (_req, res) => {
  const state = loadState();
  res.json({ patches: state.webPatches.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
});

app.post("/web-patches", (req, res) => {
  const schema = z.object({
    projectId: z.string(),
    title: z.string().min(1),
    rationale: z.string().default(""),
    changes: z.array(z.object({
      filePath: z.string().min(1),
      content: z.string(),
      mode: z.enum(["create", "overwrite"]).default("overwrite")
    })).min(1)
  });
  const body = schema.parse(req.body);
  const state = loadState();
  const project = state.projects.find((p) => p.id === body.projectId);
  if (!project) return res.status(404).json({ error: "project not found" });
  const changes = validatePatch(project, body.changes);
  const patch: WebPatch = {
    id: nanoid(10),
    projectId: body.projectId,
    title: body.title,
    rationale: body.rationale,
    status: "needs_approval",
    changes,
    createdBy: "chatgpt-web",
    events: [{ at: now(), type: "web_patch_created", message: "Waiting for user approval before writing files." }],
    createdAt: now(),
    updatedAt: now()
  };
  state.webPatches.push(patch);
  saveState(state);
  res.status(201).json({ patch, note: "Review the full file replacements before calling apply_web_patch." });
});

app.get("/web-patches/:id", (req, res) => {
  const state = loadState();
  const patch = state.webPatches.find((p) => p.id === req.params.id);
  if (!patch) return res.status(404).json({ error: "patch not found" });
  res.json({ patch });
});

app.get("/web-patches/:id/diff", (req, res) => {
  const state = loadState();
  const patch = state.webPatches.find((p) => p.id === req.params.id);
  if (!patch) return res.status(404).json({ error: "patch not found" });
  const project = state.projects.find((p) => p.id === patch.projectId);
  if (!project) return res.status(404).json({ error: "project not found" });
  res.json({ diff: diffWebPatch(patch, project) });
});

app.post("/web-patches/:id/revert", (req, res) => {
  const schema = z.object({ confirm: z.boolean(), note: z.string().optional() });
  const body = schema.parse(req.body || {});
  if (!body.confirm) throw new Error("confirm must be true to revert a patch");
  const state = loadState();
  const patch = state.webPatches.find((p) => p.id === req.params.id);
  if (!patch) return res.status(404).json({ error: "patch not found" });
  if (patch.status !== "applied") throw new Error(`patch cannot be reverted from status ${patch.status}`);
  const project = state.projects.find((p) => p.id === patch.projectId);
  if (!project) return res.status(404).json({ error: "project not found" });
  assertMutationsAllowed(state.settings, "revert web patch");
  const result = revertWebPatch(patch, project);
  patch.status = "reverted";
  patch.updatedAt = now();
  patch.events.push({ at: now(), type: "web_patch_reverted", message: body.note || "Patch reverted from local backup.", data: result });
  saveState(state);
  writeLog("warn", "web_patch", "Web patch reverted", { patchId: patch.id, projectId: project.id });
  res.json({ patch, result });
});

app.post("/web-patches/:id/apply", (req, res) => {
  const schema = z.object({ confirm: z.boolean(), note: z.string().optional() });
  const body = schema.parse(req.body || {});
  if (!body.confirm) throw new Error("confirm must be true to apply a web-authored patch");
  const state = loadState();
  const patch = state.webPatches.find((p) => p.id === req.params.id);
  if (!patch) return res.status(404).json({ error: "patch not found" });
  if (patch.status !== "needs_approval") throw new Error(`patch cannot be applied from status ${patch.status}`);
  const project = state.projects.find((p) => p.id === patch.projectId);
  if (!project) return res.status(404).json({ error: "project not found" });
  assertMutationsAllowed(state.settings, "apply web patch");
  if (!state.settings.allowWebPatchApply) throw new Error("web patch apply is disabled by the current permission mode");
  const result = applyWebPatch(patch, project);
  writeLog("info", "web_patch", "Web patch applied", { patchId: patch.id, projectId: project.id, changedFiles: patch.changes.map((c) => c.filePath) }, (req as Request & { requestId?: string }).requestId);
  patch.status = "applied";
  patch.appliedAt = now();
  patch.updatedAt = now();
  patch.events.push({ at: now(), type: "web_patch_applied", message: body.note || "Patch applied to local files.", data: result });
  saveState(state);
  res.json({ patch, result });
});

app.post("/web-patches/:id/reject", (req, res) => {
  const schema = z.object({ reason: z.string().optional() });
  const body = schema.parse(req.body || {});
  const state = loadState();
  const patch = state.webPatches.find((p) => p.id === req.params.id);
  if (!patch) return res.status(404).json({ error: "patch not found" });
  if (patch.status === "applied") throw new Error("applied patches cannot be rejected");
  patch.status = "rejected";
  patch.rejectedAt = now();
  patch.updatedAt = now();
  patch.events.push({ at: now(), type: "web_patch_rejected", message: body.reason || "Rejected by user." });
  saveState(state);
  res.json({ patch });
});

app.post("/web-patches/:id/create-codex-review-job", (req, res) => {
  const schema = z.object({ runImmediately: z.boolean().default(false) });
  const body = schema.parse(req.body || {});
  const state = loadState();
  const patch = state.webPatches.find((p) => p.id === req.params.id);
  if (!patch) return res.status(404).json({ error: "patch not found" });
  const project = state.projects.find((p) => p.id === patch.projectId);
  if (!project) return res.status(404).json({ error: "project not found" });
  const task = [
    "Review the web-authored patch that ChatGPT applied or proposed.",
    `Patch title: ${patch.title}`,
    `Patch status: ${patch.status}`,
    `Rationale: ${patch.rationale}`,
    "Files:",
    ...patch.changes.map((c) => `- ${c.filePath} (${c.mode})`),
    "",
    "Check for type errors, style issues, missing imports, broken tests, accessibility problems, and integration risks. Run the smallest relevant tests. Fix only issues introduced by this patch."
  ].join("\n");
  const requiresApproval = REQUIRE_APPROVAL_FOR_ALL_RUNS;
  const job: Job = {
    id: nanoid(10),
    projectId: project.id,
    title: `Review web patch: ${patch.title}`,
    task,
    roles: ["qa_reviewer", "frontend_engineer", "security_reviewer"],
    status: requiresApproval ? "needs_approval" : "queued",
    safetyLevel: 2,
    requiresApproval,
    codexPrompt: buildCodexPrompt({ title: `Review web patch: ${patch.title}`, task, roles: ["qa_reviewer", "frontend_engineer", "security_reviewer"], safetyLevel: 2 }, project),
    events: [{ at: now(), type: "job_created_from_web_patch", message: `Created from web patch ${patch.id}` }],
    createdAt: now(),
    updatedAt: now()
  };
  state.jobs.push(job);
  saveState(state);
  res.status(201).json({ job, note: body.runImmediately ? "Approve before running if approval is required." : "Codex review job created." });
});

app.get("/codex/jobs", (_req, res) => {
  const state = loadState();
  res.json({ jobs: state.jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
});

app.post("/codex/jobs", async (req, res) => {
  const schema = z.object({
    projectId: z.string(),
    title: z.string().min(1),
    task: z.string().min(1),
    roles: z.array(z.string()).default([]),
    safetyLevel: z.number().int().min(0).max(5).default(1),
    runImmediately: z.boolean().default(false)
  });
  const body = schema.parse(req.body);
  const state = loadState();
  const project = state.projects.find((p) => p.id === body.projectId);
  if (!project) return res.status(404).json({ error: "project not found" });

  const requiresApproval = requiresApprovalForJob(body.safetyLevel, state.settings);
  const job: Job = {
    id: nanoid(10),
    projectId: body.projectId,
    title: body.title,
    task: body.task,
    roles: body.roles,
    status: requiresApproval ? "needs_approval" : "queued",
    safetyLevel: body.safetyLevel,
    requiresApproval,
    codexPrompt: buildCodexPrompt(body, project),
    events: [{ at: now(), type: "job_created", message: requiresApproval ? `Waiting for user approval. Permission mode: ${state.settings.permissionMode}` : `Queued. Permission mode: ${state.settings.permissionMode}` }],
    createdAt: now(),
    updatedAt: now()
  };
  state.jobs.push(job);
  saveState(state);

  if (body.runImmediately && !requiresApproval) {
    const completed = await runJob(job.id);
    res.status(201).json({ job: completed });
    return;
  }
  res.status(201).json({ job, note: requiresApproval ? "Approve this job before execution." : "Job is queued." });
});

app.get("/codex/jobs/:id", (req, res) => {
  const state = loadState();
  const job = state.jobs.find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: "job not found" });
  res.json({ job });
});

app.get("/codex/jobs/:id/result", (req, res) => {
  const state = loadState();
  const job = state.jobs.find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: "job not found" });
  res.json({
    id: job.id,
    status: job.status,
    result: job.result || null,
    stdout: job.stdout || null,
    stderr: job.stderr || null,
    exitCode: job.exitCode ?? null,
    events: job.events
  });
});

app.post("/codex/jobs/:id/approve", async (req, res) => {
  const schema = z.object({ runNow: z.boolean().default(false), note: z.string().optional() });
  const body = schema.parse(req.body);
  const approved = updateJob(req.params.id, (job) => {
    if (!["needs_approval", "queued"].includes(job.status)) throw new Error(`job cannot be approved from status ${job.status}`);
    job.approvedAt = now();
    job.status = "queued";
    job.events.push({ at: now(), type: "approved", message: body.note || "User approved execution." });
  });
  if (body.runNow) {
    const completed = await runJob(approved.id);
    res.json({ job: completed });
    return;
  }
  res.json({ job: approved });
});

app.post("/codex/jobs/:id/run", async (req, res) => {
  const completed = await runJob(req.params.id);
  res.json({ job: completed });
});

app.post("/codex/jobs/:id/reject", (req, res) => {
  const schema = z.object({ reason: z.string().optional() });
  const body = schema.parse(req.body);
  const job = updateJob(req.params.id, (j) => {
    if (["completed", "running"].includes(j.status)) throw new Error(`job cannot be rejected from status ${j.status}`);
    j.status = "rejected";
    j.rejectedAt = now();
    j.events.push({ at: now(), type: "rejected", message: body.reason || "User rejected execution." });
  });
  res.json({ job });
});

app.post("/codex/jobs/:id/cancel", (req, res) => {
  const job = updateJob(req.params.id, (j) => {
    if (["completed", "failed", "cancelled"].includes(j.status)) throw new Error(`job cannot be cancelled from status ${j.status}`);
    j.status = "cancelled";
    j.events.push({ at: now(), type: "cancelled", message: "User cancelled job." });
  });
  res.json({ job });
});


app.post("/codex/jobs/:id/run-async", (req, res) => {
  const state = loadState();
  const job = state.jobs.find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: "job not found" });
  res.json({ job, note: "Job started in the background. Refresh or poll the job result." });
  runJob(req.params.id).catch((err) => {
    updateJob(req.params.id, (j) => {
      j.status = "failed";
      j.error = err instanceof Error ? err.message : String(err);
      j.events.push({ at: now(), type: "run_async_failed", message: j.error || "unknown error" });
    });
  });
});

app.post("/codex/jobs/:id/external-output", (req, res) => {
  const schema = z.object({ source: z.string().default("codex-app"), output: z.string().min(1), note: z.string().optional() });
  const body = schema.parse(req.body || {});
  const job = updateJob(req.params.id, (j) => {
    j.stdout = [j.stdout, `\n--- external output from ${body.source} ---\n`, body.output].filter(Boolean).join("\n");
    j.result = body.output;
    if (!["completed", "failed"].includes(j.status)) j.status = "completed";
    j.events.push({ at: now(), type: "external_output_mirrored", message: body.note || `Mirrored output from ${body.source}.` });
  });
  res.json({ job });
});

app.get("/codex/account", async (_req, res) => {
  const execution = currentExecution();
  if (execution !== "app-server") {
    res.json({
      execution,
      note: "Account introspection is implemented through codex app-server. Switch execution mode to app-server in Dashboard > Settings to read account and rate-limit state from Codex. CLI mode uses whichever Codex account your local codex binary is currently logged into."
    });
    return;
  }
  const info = await readCodexAccountViaAppServer();
  res.json({ execution, ...info });
});

app.post("/codex/session/reset", (_req, res) => {
  res.json({
    ok: true,
    note: "This bridge starts a fresh Codex CLI/app-server process per job. After you switch Codex accounts with your own shortcut, the next job should use the account seen by your local codex binary. If you run a future persistent app-server adapter, restart it after switching accounts."
  });
});

app.get("/codex/approvals", (_req, res) => {
  const state = loadState();
  res.json({ approvals: state.approvalRequests.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
});

app.post("/codex/approvals/:id/decision", (req, res) => {
  const schema = z.object({ decision: z.enum(["accept", "decline", "cancel"]), note: z.string().optional() });
  const body = schema.parse(req.body || {});
  const state = loadState();
  const approval = state.approvalRequests.find((item) => item.id === req.params.id);
  if (!approval) return res.status(404).json({ error: "approval request not found" });
  if (approval.status !== "pending") throw new Error(`approval cannot be changed from status ${approval.status}`);
  approval.status = body.decision === "accept" ? "approved" : "declined";
  approval.decision = body.decision;
  approval.updatedAt = now();
  approval.events.push({ at: now(), type: "approval_decision", message: body.note || `User selected ${body.decision}.` });
  saveState(state);
  appendJobEvent(approval.jobId, "approval_decision", `Dashboard selected ${body.decision} for approval ${approval.id}.`);
  res.json({ approval });
});

app.get("/errors/latest", (req, res) => {
  const requestId = typeof req.query.requestId === "string" ? req.query.requestId : undefined;
  const limit = Math.max(1, Math.min(20, Number(req.query.limit || 5)));
  const logs = readRecentLogs(300, "error");
  const filtered = requestId ? logs.filter((log) => log.requestId === requestId) : logs.slice(0, limit);
  res.json({ errors: filtered.slice(0, limit), repairProposalEndpoint: "/repairs", note: "ChatGPT should analyze one error, give a concise diagnosis, then create a repair proposal only after the user asks to proceed." });
});

app.get("/repairs", (_req, res) => {
  const state = loadState();
  res.json({ repairs: state.repairProposals.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
});

app.post("/repairs", (req, res) => {
  const schema = z.object({
    projectId: z.string().optional(), sourceRequestId: z.string().optional(), sourceLogId: z.string().optional(),
    sourceKind: z.enum(["http_error", "job_failure", "manual"]).default("manual"), errorSummary: z.string().min(1), conciseDiagnosis: z.string().min(1), solution: z.string().min(1),
    executionPlan: z.array(z.string()).min(1), codexTask: z.string().optional(), safetyLevel: z.number().int().min(1).max(5).default(2)
  });
  const body = schema.parse(req.body || {});
  const state = loadState();
  const project = findProjectByOptionalId(state, body.projectId);
  if (body.projectId && !project) return res.status(404).json({ error: "project not found" });
  const repair: RepairProposal = {
    id: nanoid(10), projectId: project?.id, sourceRequestId: body.sourceRequestId, sourceLogId: body.sourceLogId, sourceKind: body.sourceKind,
    errorSummary: body.errorSummary, conciseDiagnosis: body.conciseDiagnosis, solution: body.solution, executionPlan: body.executionPlan,
    codexTask: body.codexTask, safetyLevel: body.safetyLevel, status: "needs_approval", createdBy: "chatgpt-web",
    events: [{ at: now(), type: "repair_created", message: "Waiting for user approval before execution." }], createdAt: now(), updatedAt: now()
  };
  state.repairProposals.push(repair);
  saveState(state);
  res.status(201).json({ repair, note: "Review the concise diagnosis and execution plan. Then approve the repair if acceptable." });
});

app.get("/repairs/:id", (req, res) => {
  const state = loadState();
  const repair = state.repairProposals.find((item) => item.id === req.params.id);
  if (!repair) return res.status(404).json({ error: "repair proposal not found" });
  res.json({ repair });
});

app.post("/repairs/:id/approve", async (req, res) => {
  const schema = z.object({ runNow: z.boolean().default(false), note: z.string().optional() });
  const body = schema.parse(req.body || {});
  const state = loadState();
  const repair = state.repairProposals.find((item) => item.id === req.params.id);
  if (!repair) return res.status(404).json({ error: "repair proposal not found" });
  if (repair.status !== "needs_approval") throw new Error(`repair cannot be approved from status ${repair.status}`);
  const project = findProjectByOptionalId(state, repair.projectId);
  if (!project) throw new Error("no project is available for repair execution");
  const requiresApproval = requiresApprovalForJob(repair.safetyLevel, state.settings);
  const task = buildRepairCodexTask(repair);
  const job: Job = {
    id: nanoid(10), projectId: project.id, title: `Repair: ${repair.errorSummary.slice(0, 80)}`, task, roles: ["debugger", "qa_reviewer"],
    status: requiresApproval ? "needs_approval" : "queued", safetyLevel: repair.safetyLevel, requiresApproval,
    codexPrompt: buildCodexPrompt({ title: `Repair: ${repair.errorSummary}`, task, roles: ["debugger", "qa_reviewer"], safetyLevel: repair.safetyLevel }, project),
    events: [{ at: now(), type: "job_created_from_repair", message: `Created from repair proposal ${repair.id}` }], createdAt: now(), updatedAt: now()
  };
  repair.status = "approved";
  repair.createdCodexJobId = job.id;
  repair.updatedAt = now();
  repair.events.push({ at: now(), type: "repair_approved", message: body.note || "User approved repair proposal.", data: { jobId: job.id } });
  state.jobs.push(job);
  saveState(state);
  if (body.runNow) {
    if (requiresApproval) {
      const approvedJob = updateJob(job.id, (j) => { j.approvedAt = now(); j.status = "queued"; j.events.push({ at: now(), type: "approved", message: "Auto-approved because user approved repair proposal." }); });
      const completed = await runJob(approvedJob.id);
      const fresh = loadState();
      const freshRepair = fresh.repairProposals.find((item) => item.id === repair.id);
      if (freshRepair) { freshRepair.status = completed.status === "completed" ? "executed" : "failed"; freshRepair.updatedAt = now(); saveState(fresh); }
      res.json({ repair: freshRepair || repair, job: completed });
      return;
    }
    const completed = await runJob(job.id);
    const fresh = loadState();
    const freshRepair = fresh.repairProposals.find((item) => item.id === repair.id);
    if (freshRepair) { freshRepair.status = completed.status === "completed" ? "executed" : "failed"; freshRepair.updatedAt = now(); saveState(fresh); }
    res.json({ repair: freshRepair || repair, job: completed });
    return;
  }
  res.json({ repair, job, note: "Repair job created. Approve/run it from Codex Jobs." });
});

app.post("/repairs/:id/reject", (req, res) => {
  const schema = z.object({ reason: z.string().optional() });
  const body = schema.parse(req.body || {});
  const state = loadState();
  const repair = state.repairProposals.find((item) => item.id === req.params.id);
  if (!repair) return res.status(404).json({ error: "repair proposal not found" });
  repair.status = "rejected";
  repair.updatedAt = now();
  repair.events.push({ at: now(), type: "repair_rejected", message: body.reason || "Rejected by user." });
  saveState(state);
  res.json({ repair });
});

app.get("/reviews", (_req, res) => {
  const state = loadState();
  res.json({ reviews: state.reviewSessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
});

app.post("/reviews", (req, res) => {
  const schema = z.object({
    projectId: z.string(),
    title: z.string().min(1),
    webPatchId: z.string().optional(),
    codexJobId: z.string().optional(),
    webSummary: z.string().optional(),
    codexSummary: z.string().optional(),
    maxRounds: z.number().int().min(1).max(3).optional()
  });
  const body = schema.parse(req.body || {});
  const state = loadState();
  const project = state.projects.find((p) => p.id === body.projectId);
  if (!project) return res.status(404).json({ error: "project not found" });
  if (!body.webPatchId && !body.codexJobId && !body.webSummary && !body.codexSummary) {
    throw new Error("review needs at least one web patch, codex job, web summary, or codex summary");
  }
  const review: ReviewSession = {
    id: nanoid(10),
    projectId: body.projectId,
    title: body.title,
    webPatchId: body.webPatchId,
    codexJobId: body.codexJobId,
    webSummary: body.webSummary,
    codexSummary: body.codexSummary,
    status: "open",
    maxRounds: body.maxRounds || state.settings.maxReviewRoundsDefault,
    roundsUsed: 0,
    events: [{ at: now(), type: "review_created", message: "Cross-review opened. Do not exceed maxRounds before making a decision." }],
    createdAt: now(),
    updatedAt: now()
  };
  state.reviewSessions.push(review);
  saveState(state);
  res.status(201).json({ review });
});

app.get("/reviews/:id", (req, res) => {
  const state = loadState();
  const review = state.reviewSessions.find((r) => r.id === req.params.id);
  if (!review) return res.status(404).json({ error: "review not found" });
  res.json({ review });
});

app.post("/reviews/:id/round", (req, res) => {
  const schema = z.object({ speaker: z.enum(["chatgpt-web", "codex", "user"]), summary: z.string().min(1) });
  const body = schema.parse(req.body || {});
  const state = loadState();
  const review = state.reviewSessions.find((r) => r.id === req.params.id);
  if (!review) return res.status(404).json({ error: "review not found" });
  if (review.status !== "open") throw new Error(`review is not open: ${review.status}`);
  if (review.roundsUsed >= review.maxRounds) throw new Error("round limit reached; make a decision instead of continuing debate");
  review.roundsUsed += 1;
  review.updatedAt = now();
  review.events.push({ at: now(), type: "review_round", message: `${body.speaker}: ${body.summary}` });
  if (body.speaker === "chatgpt-web") review.webSummary = body.summary;
  if (body.speaker === "codex") review.codexSummary = body.summary;
  saveState(state);
  res.json({ review, stopNow: review.roundsUsed >= review.maxRounds });
});

app.post("/reviews/:id/decision", (req, res) => {
  const schema = z.object({ decision: z.enum(["web", "codex", "hybrid", "needs_human"]), rationale: z.string().min(1) });
  const body = schema.parse(req.body || {});
  const state = loadState();
  const review = state.reviewSessions.find((r) => r.id === req.params.id);
  if (!review) return res.status(404).json({ error: "review not found" });
  review.status = body.decision === "needs_human" ? "needs_human" : "accepted";
  review.decision = body.decision;
  review.rationale = body.rationale;
  review.updatedAt = now();
  review.events.push({ at: now(), type: "review_decision", message: `${body.decision}: ${body.rationale}` });
  saveState(state);
  res.json({ review });
});

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  const requestId = (req as Request & { requestId?: string }).requestId || nanoid(8);
  writeLog("error", "http.error", message, { method: req.method, path: req.path, body: compactForLog(req.body, 2000) }, requestId);
  res.status(400).json({ error: message, requestId, logHint: "Open Dashboard > Logs or call GET /logs?level=error", repair: { latestErrorEndpoint: `/errors/latest?requestId=${requestId}`, proposalEndpoint: "/repairs", instruction: "Ask ChatGPT Web to analyze this error briefly, propose one concrete repair plan, and wait for user approval before calling /repairs/:id/approve." } });
});

app.listen(PORT, HOST, () => {
  console.log(`Bridge listening on http://localhost:${PORT}`);
});
