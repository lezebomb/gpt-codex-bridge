import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { nanoid } from "nanoid";
import { z } from "zod";

import { BridgeService } from "./bridge-service.js";
import { VERSION } from "./config.js";
import { JsonObject } from "./types.js";

function mcpJson(data: JsonObject): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data
  };
}

function mcpError(toolName: string, requestId: string, error: unknown): CallToolResult {
  const message = error instanceof Error ? error.message : String(error);
  const body = {
    ok: false,
    tool: toolName,
    requestId,
    error: message,
    logHint: "Open Dashboard > Logs, or call get_latest_logs with this requestId."
  };
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify(body, null, 2) }],
    structuredContent: body
  };
}

function registerTool(server: McpServer, service: BridgeService, name: string, description: string, inputSchema: any, handler: (args: any, requestId: string, runId: string) => Promise<JsonObject> | JsonObject) {
  const metadata = service.toolRegistry.get(name);
  server.registerTool(name, { title: name, description: metadata?.description || description, inputSchema }, async (args: any): Promise<CallToolResult> => {
    const requestId = nanoid(8);
    const run = service.beginToolRun(name, args || {}, requestId);
    try {
      service.logStore.write({
        level: "info",
        source: "mcp",
        action: name,
        message: `MCP tool called: ${name}`,
        requestId,
        runId: run.id,
        details: args
      });
      const result = await handler(args || {}, requestId, run.id);
      service.completeToolRun(run.id, result);
      return mcpJson({ ok: true, requestId, runId: run.id, ...result });
    } catch (error) {
      service.failToolRun(run.id, error);
      service.logStore.write({
        level: "error",
        source: "mcp",
        action: name,
        message: `MCP tool failed: ${name}`,
        requestId,
        runId: run.id,
        details: { error: error instanceof Error ? error.message : String(error), args }
      });
      return mcpError(name, requestId, error);
    }
  });
}

export function createMcpServer(service: BridgeService): McpServer {
  const server = new McpServer(
    { name: "chatgpt-web-first-bridge", version: VERSION },
    {
      instructions: "Use this bridge to manage registered local projects, create task-bound context packs, route work to WebAgent or Codex, and keep project/task state grounded in MCP instead of conversation memory."
    }
  );

  registerTool(server, service, "get_bridge_status", "Return bridge version, run mode, permission mode, default executor, project count, task count, and recent error summary.", {}, async () => service.getBridgeStatus());
  registerTool(server, service, "get_setup_guide", "Return the Windows PowerShell startup flow, MCP URL, Cloudflare URL format, and local pairing code guidance.", {}, () => service.getSetupGuide());
  registerTool(server, service, "get_tool_registry", "Return Tool Registry metadata for MCP tools.", { category: z.string().optional() }, (args) => service.getToolRegistry(args));
  registerTool(server, service, "get_tool_policy", "Return approval policy summary for tools/actions.", { toolName: z.string().optional() }, (args) => service.getToolPolicy(args));
  registerTool(server, service, "explain_tool_risk", "Explain risk and side effects for one MCP tool.", { toolName: z.string() }, (args) => service.explainToolRisk(args));
  registerTool(server, service, "browse_folders", "Browse safe local folders for file-manager style project selection. Only returns directories.", { path: z.string().optional() }, (args) => service.browseFolders(args.path));
  registerTool(server, service, "select_project", "Register a selected local folder as a project allowlist root and return projectId.", { path: z.string(), displayName: z.string().optional(), allowShell: z.boolean().optional() }, (args) => {
    const result = service.selectProject(args);
    return { ...result, projectId: result.project.id };
  });
  registerTool(server, service, "list_projects", "List registered local projects.", {}, () => ({ projects: service.listProjects() }));
  registerTool(server, service, "inspect_project", "Inspect a project tree, README, package.json, git status, rule files, and inferred tech stack.", { projectId: z.string().optional() }, async (args) => ({ project: await service.inspectProject(args.projectId) }));
  registerTool(server, service, "read_file", "Read a file inside a registered project root. Path traversal and absolute paths are blocked.", { projectId: z.string(), filePath: z.string() }, (args) => ({ file: service.readFile(args.projectId, args.filePath) }));
  registerTool(server, service, "index_project", "Create or refresh a token-conscious project context index backed by SQLite FTS.", {
    projectId: z.string(),
    force: z.boolean().default(false)
  }, (args) => ({ index: service.indexProject(args) }));
  registerTool(server, service, "get_index_status", "Read indexed file count, last indexed time, stale files, and provider status.", {
    projectId: z.string()
  }, (args) => ({ index: service.getIndexStatus(args.projectId) }));
  registerTool(server, service, "search_project", "Search the indexed project context and return concise matches plus snippets.", {
    projectId: z.string(),
    query: z.string(),
    limit: z.number().int().min(1).max(12).default(5)
  }, (args) => service.searchProject(args));
  registerTool(server, service, "retrieve_context", "Retrieve a small, relevant context bundle for one query instead of dumping full files.", {
    projectId: z.string(),
    taskId: z.string().optional(),
    taskBranchId: z.string().optional(),
    query: z.string(),
    purpose: z.string().optional(),
    maxFiles: z.number().int().min(1).max(12).default(6),
    maxSnippets: z.number().int().min(1).max(24).default(10),
    includeRules: z.boolean().default(true),
    includeSkills: z.boolean().default(true)
  }, (args) => ({ retrievedContext: service.retrieveContext(args) }));
  registerTool(server, service, "refresh_context_index", "Force-refresh the project context index.", {
    projectId: z.string()
  }, (args) => ({ index: service.refreshContextIndex(args.projectId) }));
  registerTool(server, service, "create_context_pack", "Create a bounded context pack with directory summary, selected file snippets, rule summaries, skills, and git status.", {
    projectId: z.string(),
    taskId: z.string().optional(),
    taskBranchId: z.string().optional(),
    goal: z.string().optional(),
    paths: z.array(z.string()).default([]),
    includeTree: z.boolean().default(true),
    includeGitStatus: z.boolean().default(true),
    includeDiff: z.boolean().default(false),
    budget: z.enum(["small", "medium", "large"]).default("small"),
    explicitFullRead: z.boolean().default(false)
  }, (args) => service.createContextPack(args));
  registerTool(server, service, "create_task", "Create a task bound to one project, with executor routing, conflict detection, and optional context collection hints.", {
    projectId: z.string(),
    taskTitle: z.string().optional(),
    taskGoal: z.string(),
    executorMode: z.enum(["webagent", "codex", "hybrid", "external"]).optional(),
    executorPolicy: z.enum(["save_codex_quota", "best_result", "fast", "manual"]).optional(),
    targetFiles: z.array(z.string()).default([]),
    contextPaths: z.array(z.string()).default([]),
    relatedConversationHint: z.string().optional(),
    createContextPack: z.boolean().default(false)
  }, (args) => service.createTask(args));
  registerTool(server, service, "list_tasks", "List tasks, optionally scoped to a project.", { projectId: z.string().optional() }, (args) => ({ tasks: service.listTasks(args.projectId) }));
  registerTool(server, service, "get_task", "Read one task plus related context packs, patches, execution jobs, and shell commands.", { taskId: z.string() }, (args) => service.getTask(args.taskId));
  registerTool(server, service, "continue_task", "Continue a task in a new ChatGPT conversation by reloading MCP-backed task state and optionally refreshing context.", {
    taskId: z.string(),
    taskBranchId: z.string().optional(),
    note: z.string().optional(),
    relatedConversationHint: z.string().optional(),
    createContextPack: z.boolean().default(false)
  }, (args) => service.continueTask(args));
  registerTool(server, service, "create_task_branch", "Create a new task branch under one task for a separate ChatGPT conversation.", {
    taskId: z.string(),
    branchName: z.string().optional(),
    branchGoal: z.string().optional(),
    chatTitleHint: z.string().optional(),
    touchedFiles: z.array(z.string()).default([])
  }, (args) => ({ taskBranch: service.createTaskBranch(args) }));
  registerTool(server, service, "list_task_branches", "List task branches by project or task.", {
    projectId: z.string().optional(),
    taskId: z.string().optional()
  }, (args) => ({ taskBranches: service.listTaskBranches(args) }));
  registerTool(server, service, "get_task_branch", "Read one task branch plus linked task, context, and patch state.", {
    taskBranchId: z.string()
  }, (args) => service.getTaskBranch(args.taskBranchId));
  registerTool(server, service, "continue_task_branch", "Continue one task branch and get the recommended next action.", {
    taskBranchId: z.string(),
    note: z.string().optional(),
    createContextPack: z.boolean().default(false)
  }, (args) => service.continueTaskBranch(args));
  registerTool(server, service, "rename_task_branch", "Rename one task branch or update its chat title hint.", {
    taskBranchId: z.string(),
    branchName: z.string(),
    chatTitleHint: z.string().optional()
  }, (args) => ({ taskBranch: service.renameTaskBranch(args) }));
  registerTool(server, service, "archive_task_branch", "Archive one task branch without deleting history.", {
    taskBranchId: z.string()
  }, (args) => ({ taskBranch: service.archiveTaskBranch(args.taskBranchId) }));
  registerTool(server, service, "set_active_task_branch", "Mark one task branch as the active branch for its task.", {
    taskId: z.string(),
    taskBranchId: z.string()
  }, (args) => ({ task: service.setActiveTaskBranch(args) }));
  registerTool(server, service, "detect_branch_conflicts", "Detect overlapping touched files and stale git-head conflicts across active branches.", {
    taskBranchId: z.string()
  }, (args) => ({ conflicts: service.detectBranchConflicts(args) }));
  registerTool(server, service, "recommend_isolation_mode", "Recommend in_place, git_worktree, or copy_workspace for a Task Branch.", {
    taskBranchId: z.string().optional(),
    executorMode: z.enum(["webagent", "codex", "hybrid", "external"]).optional(),
    touchedFiles: z.array(z.string()).default([]),
    riskHint: z.enum(["low", "medium", "high"]).optional()
  }, (args) => ({ recommendation: service.recommendIsolationMode(args) }));
  registerTool(server, service, "create_task_worktree", "Create an optional isolated workspace for one Task Branch.", {
    taskBranchId: z.string(),
    isolationMode: z.enum(["in_place", "git_worktree", "copy_workspace"]).optional()
  }, (args, requestId, runId) => service.createTaskWorktree(args, requestId, runId));
  registerTool(server, service, "get_task_worktree_status", "Read Task Branch isolation/worktree status.", {
    taskBranchId: z.string()
  }, (args) => ({ status: service.getTaskWorktreeStatus(args.taskBranchId) }));
  registerTool(server, service, "cleanup_task_worktree", "Cleanup an isolated workspace or git worktree.", {
    taskBranchId: z.string(),
    confirm: z.boolean().default(false)
  }, (args, requestId, runId) => service.cleanupTaskWorktree(args, requestId, runId));
  registerTool(server, service, "propose_web_patch", "Create a bounded patch draft without writing local files immediately.", {
    projectId: z.string(),
    taskId: z.string().optional(),
    taskBranchId: z.string().optional(),
    title: z.string(),
    rationale: z.string().optional(),
    changes: z.array(z.object({ filePath: z.string(), mode: z.enum(["create", "overwrite"]).default("overwrite"), content: z.string() })).min(1)
  }, (args, requestId) => ({ patch: service.proposeWebPatch(args, requestId) }));
  registerTool(server, service, "get_patch_diff", "Return a readable diff for a patch draft.", { patchId: z.string() }, (args) => ({ diff: service.getPatchDiff(args.patchId) }));
  registerTool(server, service, "get_patch_conflict_status", "Return stale-base and Task Branch conflict status for one patch before apply.", {
    patchId: z.string()
  }, (args) => ({ conflictStatus: service.getPatchConflictStatus(args.patchId) }));
  registerTool(server, service, "preflight_patch_apply", "Run patch apply preflight without writing files.", { patchId: z.string() }, (args, _requestId, runId) => ({ preflightReport: service.preflightPatchApply(args.patchId, runId) }));
  registerTool(server, service, "request_apply_patch", "Apply a patch if permission mode allows it, otherwise return a dashboard approval instruction.", { patchId: z.string() }, (args, requestId, runId) => service.requestApplyPatch(args.patchId, requestId, runId));
  registerTool(server, service, "request_revert_patch", "Revert an applied patch if permission mode allows it, otherwise return a dashboard approval instruction.", { patchId: z.string() }, (args, requestId, runId) => service.requestRevertPatch(args.patchId, requestId, runId));
  registerTool(server, service, "run_shell_command", "Create a shell command request with timeout, cwd, stdout/stderr capture, and dangerous-command blocking.", {
    projectId: z.string(),
    taskId: z.string().optional(),
    taskBranchId: z.string().optional(),
    command: z.string(),
    cwd: z.string().optional(),
    timeoutMs: z.number().int().min(1000).max(600000).default(60000),
    shell: z.enum(["powershell", "cmd", "bash"]).default("powershell"),
    runImmediately: z.boolean().default(false)
  }, (args, requestId, runId) => service.runShellCommand(args, requestId, runId));
  registerTool(server, service, "create_execution_job", "Create an executor job using WebAgent, Codex, Hybrid, or External routing for one task.", {
    taskId: z.string(),
    taskBranchId: z.string().optional(),
    executorMode: z.enum(["webagent", "codex", "hybrid", "external"]).optional(),
    executorPolicy: z.enum(["save_codex_quota", "best_result", "fast", "manual"]).optional(),
    externalExecutorId: z.string().optional(),
    runImmediately: z.boolean().default(false)
  }, (args, requestId, runId) => service.createExecutionJob(args, requestId, runId));
  registerTool(server, service, "list_runs", "List Agent Run records.", {
    projectId: z.string().optional(),
    taskId: z.string().optional(),
    taskBranchId: z.string().optional(),
    status: z.enum(["queued", "running", "waiting_for_approval", "waiting_for_user", "completed", "failed", "cancelled"]).optional(),
    limit: z.number().int().min(1).max(500).default(100)
  }, (args) => ({ runs: service.listRuns(args) }));
  registerTool(server, service, "get_run", "Read one Agent Run and event timeline.", { runId: z.string() }, (args) => service.getRun(args.runId));
  registerTool(server, service, "get_run_events", "Read runtime events for one run or filtered scope.", {
    runId: z.string().optional(),
    projectId: z.string().optional(),
    taskId: z.string().optional(),
    taskBranchId: z.string().optional(),
    requestId: z.string().optional(),
    limit: z.number().int().min(1).max(500).default(200)
  }, (args) => ({ events: service.getRunEvents(args) }));
  registerTool(server, service, "cancel_run", "Mark a run cancelled and try best-effort process cancellation.", { runId: z.string(), reason: z.string().optional() }, (args) => service.cancelRun(args));
  registerTool(server, service, "get_execution_job", "Read one execution job and its result/log fields.", { jobId: z.string() }, (args) => ({ job: service.getExecutionJob(args.jobId) }));
  registerTool(server, service, "get_latest_logs", "Read recent logs with optional level, requestId, projectId, taskId, and limit filters.", {
    level: z.enum(["debug", "info", "warn", "error"]).optional(),
    requestId: z.string().optional(),
    projectId: z.string().optional(),
    taskId: z.string().optional(),
    taskBranchId: z.string().optional(),
    runId: z.string().optional(),
    limit: z.number().int().min(1).max(500).default(100)
  }, async (args) => ({ logs: await service.getLatestLogs(args) }));
  registerTool(server, service, "analyze_error_log", "Analyze the latest or matching error log and return likely cause plus next actions.", { requestId: z.string().optional(), logId: z.string().optional() }, (args) => ({ analysis: service.analyzeErrorLog(args) }));
  registerTool(server, service, "create_repair_proposal", "Create a repair proposal from an error. It never executes automatically and requires user approval.", {
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
  }, (args) => ({ repair: service.createRepairProposal(args) }));
  registerTool(server, service, "create_ui_screenshot_job", "Create a UI screenshot review job. If the dev server is missing, return clear startup guidance.", {
    projectId: z.string(),
    taskId: z.string().optional(),
    devServerUrl: z.string().optional(),
    route: z.string().optional(),
    notes: z.string().optional(),
    runImmediately: z.boolean().default(true)
  }, (args, requestId) => service.createUiScreenshotJob(args, requestId));
  registerTool(server, service, "get_ui_screenshot_result", "Read the UI screenshot review result by execution job id.", { jobId: z.string() }, (args) => ({ job: service.getUiScreenshotResult(args.jobId) }));
  registerTool(server, service, "create_cross_review", "Open a bounded cross review between WebAgent and Codex, capped at two rounds.", {
    projectId: z.string(),
    taskId: z.string().optional(),
    title: z.string(),
    webPatchId: z.string().optional(),
    executionJobId: z.string().optional(),
    webSummary: z.string().optional(),
    codexSummary: z.string().optional(),
    maxRounds: z.number().int().min(1).max(2).default(2)
  }, (args) => ({ review: service.createCrossReview(args) }));
  registerTool(server, service, "add_cross_review_round", "Add one bounded review round with blocking issues, concrete improvements, evidence, and a recommended decision.", {
    reviewId: z.string(),
    speaker: z.enum(["chatgpt-web", "codex", "user"]),
    blockingIssues: z.array(z.string()).default([]),
    concreteImprovements: z.array(z.string()).default([]),
    evidence: z.array(z.string()).default([]),
    recommendedDecision: z.enum(["use_webagent_result", "use_codex_result", "hybrid", "needs_human"])
  }, (args) => service.addCrossReviewRound(args));
  registerTool(server, service, "finalize_cross_review", "Finalize a bounded cross review with a final decision.", {
    reviewId: z.string(),
    decision: z.enum(["use_webagent_result", "use_codex_result", "hybrid", "needs_human"]),
    rationale: z.string()
  }, (args) => ({ review: service.finalizeCrossReview(args) }));

  registerTool(server, service, "create_webagent_task", "Shortcut: create a WebAgent task, then immediately create its execution job.", {
    projectId: z.string(),
    taskTitle: z.string().optional(),
    taskGoal: z.string(),
    targetFiles: z.array(z.string()).default([])
  }, async (args, requestId, runId) => {
    const created = service.createTask({ ...args, executorMode: "webagent", executorPolicy: "save_codex_quota" });
    const execution = await service.createExecutionJob({ taskId: created.task.id, executorMode: "webagent", runImmediately: true }, requestId, runId);
    return { task: created.task, execution };
  });

  registerTool(server, service, "create_codex_job", "Legacy alias: create a Codex execution job for one task.", {
    taskId: z.string(),
    runImmediately: z.boolean().default(false)
  }, (args, requestId, runId) => service.createExecutionJob({ taskId: args.taskId, executorMode: "codex", runImmediately: args.runImmediately }, requestId, runId));
  registerTool(server, service, "get_codex_job", "Legacy alias: read one execution job.", { jobId: z.string() }, (args) => ({ job: service.getExecutionJob(args.jobId) }));

  return server;
}
