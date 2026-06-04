import express, { NextFunction, Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { nanoid } from "nanoid";
import path from "node:path";
import { z } from "zod";

import { BridgeService } from "./bridge-service.js";
import { DASHBOARD_DIR, HOST, PORT } from "./config.js";
import { createMcpServer } from "./mcp-server.js";

const service = new BridgeService();
const app = express();

app.use(express.json({ limit: "8mb" }));
app.use("/dashboard", express.static(DASHBOARD_DIR));
app.get("/", (_req, res) => res.redirect("/dashboard/"));

const mcpSessions = new Map<string, { server: ReturnType<typeof createMcpServer>; transport: StreamableHTTPServerTransport; createdAt: string }>();

function isLoopbackRequest(req: Request): boolean {
  const remote = String(req.socket.remoteAddress || req.ip || "").replace(/^::ffff:/, "");
  return remote === "127.0.0.1" || remote === "::1" || remote === "localhost" || remote === "";
}

function normalizeHostValue(value: string): string {
  const trimmed = String(value || "").trim().toLowerCase();
  if (!trimmed) return "";
  const withoutProtocol = trimmed.replace(/^[a-z]+:\/\//, "");
  const hostPort = withoutProtocol.split("/")[0];
  if (hostPort.startsWith("[")) {
    const match = hostPort.match(/^\[([^\]]+)\](?::\d+)?$/);
    return match?.[1] || hostPort;
  }
  return hostPort.split(":")[0];
}

function extractForwardedHost(value: string): string {
  const match = String(value || "").match(/host=([^;,\s]+)/i);
  return match?.[1] || "";
}

function isExplicitLocalHost(value: string): boolean {
  const normalized = normalizeHostValue(value);
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

function bootstrapAllowsPairingCode(req: Request): boolean {
  const host = req.header("host") || "";
  const xForwardedHost = req.header("x-forwarded-host") || "";
  const forwarded = extractForwardedHost(req.header("forwarded") || "");
  const origin = req.header("origin") || "";
  if (!isExplicitLocalHost(host)) {
    return false;
  }
  if (xForwardedHost && !isExplicitLocalHost(xForwardedHost)) {
    return false;
  }
  if (forwarded && !isExplicitLocalHost(forwarded)) {
    return false;
  }
  if (origin && !isExplicitLocalHost(origin)) {
    return false;
  }
  return true;
}

function isMcpInitializeRequest(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  if (Array.isArray(body)) return body.some((item) => isMcpInitializeRequest(item));
  return (body as { method?: unknown }).method === "initialize";
}

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = nanoid(8);
  (req as Request & { requestId?: string }).requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
});

function auth(req: Request, res: Response, next: NextFunction): void {
  if (req.path === "/health" || req.path === "/bootstrap") {
    next();
    return;
  }
  const header = req.header("authorization") || "";
  const apiKey = req.header("x-api-key") || "";
  const runtime = service.runtimeStore.load();
  const bearer = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  const supplied = bearer || apiKey.trim();
  if (supplied !== runtime.token) {
    const requestId = (req as Request & { requestId?: string }).requestId || nanoid(8);
    service.logStore.write({
      level: "warn",
      source: "auth",
      action: "unauthorized",
      message: "Unauthorized request",
      requestId,
      details: { method: req.method, path: req.path, hasAuthorization: Boolean(header), hasApiKey: Boolean(apiKey) }
    });
    res.status(401).json({
      error: "unauthorized",
      message: "Local pairing code is missing or invalid.",
      requestId,
      logHint: "Open Dashboard > Logs or call GET /logs?level=warn"
    });
    return;
  }
  next();
}

app.use("/mcp", (req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "authorization,x-api-key,content-type,accept,mcp-session-id,last-event-id");
  res.setHeader("Access-Control-Expose-Headers", "mcp-session-id,x-request-id");
  if (req.method === "OPTIONS") {
    res.status(204).send();
    return;
  }
  next();
});

app.get("/health", (_req, res) => {
  const status = service.getBridgeStatus();
  res.json({ ok: true, execution: status.runMode, permissionMode: status.permissionMode, version: status.bridgeVersion });
});

app.get("/bootstrap", (req, res) => {
  if (!isLoopbackRequest(req) || !bootstrapAllowsPairingCode(req)) {
    res.status(403).json({ error: "bootstrap_is_local_only" });
    return;
  }
  res.json(service.getBootstrap());
});

app.use(auth);

app.all("/mcp", async (req, res) => {
  const requestId = (req as Request & { requestId?: string }).requestId || nanoid(8);
  try {
    const rawSessionId = req.header("mcp-session-id") || "";
    let session = rawSessionId ? mcpSessions.get(rawSessionId) : undefined;
    let createdSessionId = "";
    if (!session) {
      if (req.method !== "POST" || !isMcpInitializeRequest(req.body)) {
        res.status(400).json({
          error: "mcp_session_required",
          message: "Start with an MCP initialize request, then reuse the returned mcp-session-id header.",
          requestId
        });
        return;
      }
      const server = createMcpServer(service);
      createdSessionId = nanoid(14);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => createdSessionId });
      await server.connect(transport);
      session = { server, transport, createdAt: new Date().toISOString() };
    }
    await session.transport.handleRequest(req, res, req.body);
    const sessionId = session.transport.sessionId || createdSessionId;
    if (sessionId) {
      mcpSessions.set(sessionId, session);
    }
  } catch (error) {
    service.logStore.write({
      level: "error",
      source: "mcp",
      action: "transport_error",
      message: error instanceof Error ? error.message : String(error),
      requestId
    });
    res.status(500).json({ error: "mcp_transport_error", requestId, message: error instanceof Error ? error.message : String(error) });
  }
});

app.get("/config", (_req, res) => {
  res.json(service.getConfig());
});

app.post("/config/runtime", (req, res) => {
  const body = z.object({ execution: z.enum(["dry-run", "cli", "app-server"]) }).parse(req.body || {});
  res.json({ runtime: service.updateRuntimeExecution(body.execution) });
});

app.post("/config/access-mode", (req, res) => {
  const body = z.object({ permissionMode: z.enum(["read_only", "manual_review", "auto_review", "full_access"]), confirmFullAccess: z.string().optional() }).parse(req.body || {});
  res.json({ settings: service.updatePermissionMode(body) });
});

app.get("/logs", async (req, res) => {
  const query = z.object({
    level: z.enum(["debug", "info", "warn", "error"]).optional(),
    requestId: z.string().optional(),
    projectId: z.string().optional(),
    taskId: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100)
  }).parse(req.query || {});
  res.json({ logs: await service.getLatestLogs(query) });
});

app.get("/errors/latest", (req, res) => {
  const query = z.object({ requestId: z.string().optional(), logId: z.string().optional() }).parse(req.query || {});
  res.json({ analysis: service.analyzeErrorLog(query) });
});

app.get("/fs/roots", (_req, res) => {
  res.json({ roots: service.browseFolders().roots });
});

app.get("/fs/list", (req, res) => {
  const query = z.object({ path: z.string().optional() }).parse(req.query || {});
  res.json(service.browseFolders(query.path));
});

app.get("/roles", (_req, res) => {
  res.json({ roles: service.listRoles() });
});

app.get("/skills", (req, res) => {
  const query = z.object({ projectId: z.string().optional() }).parse(req.query || {});
  res.json({ skills: service.listSkills(query.projectId) });
});

app.get("/mcp-center", (_req, res) => {
  res.json({
    server: { endpoint: "/mcp", transport: "streamable-http", auth: "local-pairing-code" },
    summary: service.getPluginSummary(),
    tools: service.getMcpToolCatalog()
  });
});

app.post("/mcp-center/plugins/:id/enable", (req, res) => {
  const body = z.object({ config: z.record(z.string(), z.unknown()).default({}) }).parse(req.body || {});
  res.json(service.updateMcpPlugin({ pluginId: req.params.id, enabled: true, config: body.config }, (req as Request & { requestId?: string }).requestId));
});

app.post("/mcp-center/plugins/:id/disable", (req, res) => {
  res.json(service.updateMcpPlugin({ pluginId: req.params.id, enabled: false }, (req as Request & { requestId?: string }).requestId));
});

app.post("/mcp-center/plugins/:id/configure", (req, res) => {
  const body = z.object({ config: z.record(z.string(), z.unknown()).default({}) }).parse(req.body || {});
  res.json(service.updateMcpPlugin({ pluginId: req.params.id, config: body.config }, (req as Request & { requestId?: string }).requestId));
});

app.get("/executors", (_req, res) => {
  res.json(service.getExecutorsInfo());
});

app.get("/diagnostics", (_req, res) => {
  res.json(service.getDiagnostics());
});

app.get("/support-bundle", (_req, res) => {
  res.json(service.getSupportBundle());
});

app.get("/projects", (_req, res) => {
  res.json({ projects: service.listProjects() });
});

app.post("/projects", (req, res) => {
  const body = z.object({ path: z.string(), displayName: z.string().optional(), allowShell: z.boolean().optional() }).parse(req.body || {});
  res.status(201).json(service.selectProject(body));
});

app.post("/projects/select", (req, res) => {
  const body = z.object({ path: z.string(), displayName: z.string().optional(), allowShell: z.boolean().optional() }).parse(req.body || {});
  res.status(201).json(service.selectProject(body));
});

app.get("/projects/:id/inspect", async (req, res) => {
  res.json({ project: await service.inspectProject(req.params.id) });
});

app.get("/projects/:id/files/read", (req, res) => {
  const query = z.object({ path: z.string() }).parse(req.query || {});
  res.json({ file: service.readFile(req.params.id, query.path) });
});

app.get("/projects/:id/index-status", (req, res) => {
  res.json({ index: service.getIndexStatus(req.params.id) });
});

app.post("/projects/:id/index", (req, res) => {
  const body = z.object({ force: z.boolean().default(false) }).parse(req.body || {});
  res.status(201).json({ index: service.indexProject({ projectId: req.params.id, force: body.force }) });
});

app.post("/projects/:id/index/refresh", (req, res) => {
  res.json({ index: service.refreshContextIndex(req.params.id) });
});

app.get("/projects/:id/search", (req, res) => {
  const query = z.object({ query: z.string(), limit: z.coerce.number().int().min(1).max(8).default(5) }).parse(req.query || {});
  res.json(service.searchProject({ projectId: req.params.id, ...query }));
});

app.post("/projects/:id/retrieve-context", (req, res) => {
  const body = z.object({
    taskId: z.string().optional(),
    taskBranchId: z.string().optional(),
    query: z.string(),
    purpose: z.string().optional(),
    maxFiles: z.number().int().min(1).max(8).default(6),
    maxSnippets: z.number().int().min(1).max(20).default(10),
    includeRules: z.boolean().default(true),
    includeSkills: z.boolean().default(true)
  }).parse(req.body || {});
  res.status(201).json({ retrievedContext: service.retrieveContext({ projectId: req.params.id, ...body }) });
});

app.post("/projects/:id/context-pack", async (req, res) => {
  const body = z.object({
    taskId: z.string().optional(),
    taskBranchId: z.string().optional(),
    goal: z.string().optional(),
    paths: z.array(z.string()).default([]),
    includeTree: z.boolean().default(true),
    includeGitStatus: z.boolean().default(true),
    includeDiff: z.boolean().default(false),
    explicitFullRead: z.boolean().default(false)
  }).parse(req.body || {});
  res.status(201).json(await service.createContextPack({ ...body, projectId: req.params.id }));
});

app.get("/projects/:id/git/status", async (req, res) => {
  const project = await service.inspectProject(req.params.id);
  res.json({ gitStatus: project.gitStatus });
});

app.get("/projects/:id/git/diff", async (req, res) => {
  const project = service.getProjectRecord(req.params.id);
  const diff = await service.diffManager.runGit(project, ["diff", "--"]);
  res.json({ diff });
});

app.get("/tasks", (req, res) => {
  const query = z.object({ projectId: z.string().optional() }).parse(req.query || {});
  res.json({ tasks: service.listTasks(query.projectId) });
});

app.post("/tasks", (req, res) => {
  const body = z.object({
    projectId: z.string(),
    taskTitle: z.string().optional(),
    taskGoal: z.string(),
    executorMode: z.enum(["webagent", "codex", "hybrid", "external"]).optional(),
    executorPolicy: z.enum(["save_codex_quota", "best_result", "fast", "manual"]).optional(),
    targetFiles: z.array(z.string()).default([]),
    contextPaths: z.array(z.string()).default([]),
    relatedConversationHint: z.string().optional(),
    createContextPack: z.boolean().default(false)
  }).parse(req.body || {});
  res.status(201).json(service.createTask(body));
});

app.get("/task-branches", (req, res) => {
  const query = z.object({ projectId: z.string().optional(), taskId: z.string().optional() }).parse(req.query || {});
  res.json({ taskBranches: service.listTaskBranches(query) });
});

app.get("/tasks/:id", (req, res) => {
  res.json(service.getTask(req.params.id));
});

app.post("/tasks/:id/branches", (req, res) => {
  const body = z.object({
    branchName: z.string().optional(),
    branchGoal: z.string().optional(),
    chatTitleHint: z.string().optional(),
    touchedFiles: z.array(z.string()).default([])
  }).parse(req.body || {});
  res.status(201).json({ taskBranch: service.createTaskBranch({ taskId: req.params.id, ...body }) });
});

app.post("/tasks/:id/continue", async (req, res) => {
  const body = z.object({ taskBranchId: z.string().optional(), note: z.string().optional(), relatedConversationHint: z.string().optional(), createContextPack: z.boolean().default(false) }).parse(req.body || {});
  res.json(await service.continueTask({ taskId: req.params.id, ...body }));
});

app.get("/task-branches/:id", (req, res) => {
  res.json(service.getTaskBranch(req.params.id));
});

app.post("/task-branches/:id/continue", async (req, res) => {
  const body = z.object({ note: z.string().optional(), createContextPack: z.boolean().default(false) }).parse(req.body || {});
  res.json(await service.continueTaskBranch({ taskBranchId: req.params.id, ...body }));
});

app.post("/task-branches/:id/rename", (req, res) => {
  const body = z.object({ branchName: z.string(), chatTitleHint: z.string().optional() }).parse(req.body || {});
  res.json({ taskBranch: service.renameTaskBranch({ taskBranchId: req.params.id, ...body }) });
});

app.post("/task-branches/:id/archive", (req, res) => {
  res.json({ taskBranch: service.archiveTaskBranch(req.params.id) });
});

app.post("/tasks/:id/active-branch", (req, res) => {
  const body = z.object({ taskBranchId: z.string() }).parse(req.body || {});
  res.json({ task: service.setActiveTaskBranch({ taskId: req.params.id, taskBranchId: body.taskBranchId }) });
});

app.get("/task-branches/:id/conflicts", (req, res) => {
  res.json({ conflicts: service.detectBranchConflicts({ taskBranchId: req.params.id }) });
});

app.get("/execution-jobs", (_req, res) => {
  res.json({ jobs: service.listExecutionJobs() });
});

app.post("/tasks/:id/executions", async (req, res) => {
  const body = z.object({
    taskBranchId: z.string().optional(),
    executorMode: z.enum(["webagent", "codex", "hybrid", "external"]).optional(),
    executorPolicy: z.enum(["save_codex_quota", "best_result", "fast", "manual"]).optional(),
    externalExecutorId: z.string().optional(),
    runImmediately: z.boolean().default(false)
  }).parse(req.body || {});
  res.status(201).json(await service.createExecutionJob({ taskId: req.params.id, ...body }));
});

app.get("/execution-jobs/:id", (req, res) => {
  res.json({ job: service.getExecutionJob(req.params.id) });
});

app.post("/execution-jobs/:id/approve-run", async (req, res) => {
  const body = z.object({ runNow: z.boolean().default(true) }).parse(req.body || {});
  const job = service.approveExecutionJob(req.params.id);
  if (body.runNow) {
    res.json(await service.runExecutionJob(job.id));
    return;
  }
  res.json({ job });
});

app.post("/execution-jobs/:id/run", async (req, res) => {
  res.json(await service.runExecutionJob(req.params.id));
});

app.get("/web-patches", (_req, res) => {
  res.json({ patches: service.listPatches() });
});

app.post("/web-patches", (req, res) => {
  const body = z.object({
    projectId: z.string(),
    taskId: z.string().optional(),
    taskBranchId: z.string().optional(),
    title: z.string(),
    rationale: z.string().optional(),
    changes: z.array(z.object({ filePath: z.string(), mode: z.enum(["create", "overwrite"]).default("overwrite"), content: z.string() })).min(1)
  }).parse(req.body || {});
  res.status(201).json({ patch: service.proposeWebPatch(body, (req as Request & { requestId?: string }).requestId) });
});

app.get("/web-patches/:id/diff", (req, res) => {
  res.json({ diff: service.getPatchDiff(req.params.id) });
});

app.post("/web-patches/:id/apply", (req, res) => {
  const body = z.object({ confirm: z.boolean() }).parse(req.body || {});
  if (!body.confirm) throw new Error("confirm must be true to apply a patch");
  res.json({ result: service.applyPatchFromDashboard(req.params.id, (req as Request & { requestId?: string }).requestId) });
});

app.post("/web-patches/:id/revert", (req, res) => {
  const body = z.object({ confirm: z.boolean() }).parse(req.body || {});
  if (!body.confirm) throw new Error("confirm must be true to revert a patch");
  res.json({ result: service.revertPatchFromDashboard(req.params.id, (req as Request & { requestId?: string }).requestId) });
});

app.post("/web-patches/:id/reject", (req, res) => {
  const body = z.object({ reason: z.string().optional() }).parse(req.body || {});
  res.json({ patch: service.rejectPatch(req.params.id, body.reason) });
});

app.post("/run-shell-command", async (req, res) => {
  const body = z.object({
    projectId: z.string(),
    taskId: z.string().optional(),
    taskBranchId: z.string().optional(),
    command: z.string(),
    cwd: z.string().optional(),
    timeoutMs: z.number().int().min(1000).max(600000).default(60000),
    shell: z.enum(["powershell", "cmd", "bash"]).default("powershell"),
    runImmediately: z.boolean().default(false)
  }).parse(req.body || {});
  res.status(201).json(await service.runShellCommand(body, (req as Request & { requestId?: string }).requestId));
});

app.post("/shell-commands/:id/approve-run", async (req, res) => {
  const body = z.object({ runNow: z.boolean().default(true) }).parse(req.body || {});
  const command = service.approveShellCommand(req.params.id);
  if (body.runNow) {
    res.json({ command: await service.shellRunner.run(command.id, (req as Request & { requestId?: string }).requestId) });
    return;
  }
  res.json({ command });
});

app.get("/approvals", (_req, res) => {
  res.json(service.getApprovals());
});

app.get("/repairs", (_req, res) => {
  res.json({ repairs: service.listRepairs() });
});

app.post("/repairs", (req, res) => {
  const body = z.object({
    projectId: z.string().optional(),
    taskId: z.string().optional(),
    sourceRequestId: z.string().optional(),
    sourceLogId: z.string().optional(),
    sourceKind: z.enum(["http_error", "job_failure", "manual"]).default("manual"),
    errorSummary: z.string(),
    conciseDiagnosis: z.string(),
    solution: z.string(),
    executionPlan: z.array(z.string()).min(1),
    codexTask: z.string().optional(),
    safetyLevel: z.number().int().min(1).max(5).default(2)
  }).parse(req.body || {});
  res.status(201).json({ repair: service.createRepairProposal(body) });
});

app.post("/repairs/:id/approve", (req, res) => {
  res.json({ repair: service.approveRepairProposal(req.params.id) });
});

app.get("/reviews", (_req, res) => {
  res.json({ reviews: service.listReviews() });
});

app.post("/reviews", (req, res) => {
  const body = z.object({
    projectId: z.string(),
    taskId: z.string().optional(),
    title: z.string(),
    webPatchId: z.string().optional(),
    executionJobId: z.string().optional(),
    webSummary: z.string().optional(),
    codexSummary: z.string().optional(),
    maxRounds: z.number().int().min(1).max(2).default(2)
  }).parse(req.body || {});
  res.status(201).json({ review: service.createCrossReview(body) });
});

app.post("/reviews/:id/round", (req, res) => {
  const body = z.object({
    speaker: z.enum(["chatgpt-web", "codex", "user"]),
    blockingIssues: z.array(z.string()).default([]),
    concreteImprovements: z.array(z.string()).default([]),
    evidence: z.array(z.string()).default([]),
    recommendedDecision: z.enum(["use_webagent_result", "use_codex_result", "hybrid", "needs_human"])
  }).parse(req.body || {});
  res.json(service.addCrossReviewRound({ reviewId: req.params.id, ...body }));
});

app.post("/reviews/:id/decision", (req, res) => {
  const body = z.object({ decision: z.enum(["use_webagent_result", "use_codex_result", "hybrid", "needs_human"]), rationale: z.string() }).parse(req.body || {});
  res.json({ review: service.finalizeCrossReview({ reviewId: req.params.id, ...body }) });
});

app.get("/codex/jobs", (_req, res) => {
  res.json({ jobs: service.listExecutionJobs().filter((job) => job.executorMode === "codex") });
});

app.post("/codex/jobs/:id/run", async (req, res) => {
  res.json(await service.runExecutionJob(req.params.id));
});

app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  const requestId = (req as Request & { requestId?: string }).requestId || nanoid(8);
  const message = error instanceof Error ? error.message : String(error);
  service.logStore.write({
    level: "error",
    source: "rest",
    action: `${req.method} ${req.path}`,
    message,
    requestId
  });
  res.status(500).json({
    error: "request_failed",
    message,
    requestId
  });
});

app.listen(PORT, HOST, () => {
  service.logStore.write({
    level: "info",
    source: "system",
    action: "server_start",
    message: `Bridge listening on http://${HOST}:${PORT}`
  });
  console.log(`Bridge listening on http://${HOST}:${PORT}`);
});
