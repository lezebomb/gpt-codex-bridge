import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { nanoid } from "nanoid";

import { CONTEXT_PACKS_DIR, EXTERNAL_EXECUTOR_CONFIG_FILE, HOST, MCP_PLUGINS, MIN_NODE_MAJOR, PORT, ROLE_DIR, VERSION } from "./config.js";
import { compactForLog, ensureDir, filePreview, now } from "./lib/common.js";
import { assertSafeRelativePath, findReadmePreview, inferTechStack, listBrowsableDirectories, listFilesystemRoots, readProjectFile, safeProjectPath } from "./project-files.js";
import { ApprovalActionType, ApprovalRequest, BridgeState, ContextPackBudget, ContextPackRecord, ExecutionJob, ExecutorMode, ExecutorPacket, ExecutorPolicy, ExternalExecutorConfig, McpPluginRuntimeConfig, Project, ProjectIndexRecord, RepairProposal, RetrievedContextRecord, ReviewSession, RuntimeEventType, TaskBranchRecord, TaskRecord, ToolMetadata, UiScreenshotRequest, WebPatch } from "./types.js";
import { ExecutorRouter } from "./executors/router.js";
import { WebAgentExecutor } from "./executors/webagent-executor.js";
import { HybridExecutor } from "./executors/hybrid-executor.js";
import { ExternalExecutor } from "./executors/external-executor.js";
import { CodexExecutor } from "./executors/codex-executor.js";
import { InstructionLoader } from "./runtime/webagent/instruction-loader.js";
import { SkillLoader } from "./runtime/webagent/skill-loader.js";
import { DiffManager } from "./runtime/webagent/diff-manager.js";
import { ContextCollector } from "./runtime/webagent/context-collector.js";
import { ApprovalEngine, normalizeSettings } from "./runtime/webagent/approval-engine.js";
import { PatchEngine } from "./runtime/webagent/patch-engine.js";
import { TaskBranchStore } from "./runtime/webagent/task-branch-store.js";
import { ShellRunner } from "./runtime/webagent/shell-runner.js";
import { TaskStore } from "./runtime/webagent/task-store.js";
import { UiScreenshotRunner } from "./runtime/webagent/ui-screenshot-runner.js";
import { ContextRetriever } from "./runtime/context/context-retriever.js";
import { ProjectIndexer } from "./runtime/context/project-indexer.js";
import { RuntimeStore } from "./runtime/runtime-store.js";
import { StateStore } from "./runtime/state-store.js";
import { LogStore } from "./runtime/log-store.js";
import { EventStore } from "./runtime/events/event-store.js";
import { RunStore } from "./runtime/events/run-store.js";
import { ToolRegistry } from "./runtime/tools/tool-registry.js";
import { ApprovalPolicyEngine } from "./runtime/tools/tool-permission.js";
import { TaskWorktreeManager } from "./runtime/isolation/task-worktree-manager.js";

export class BridgeService {
  readonly runtimeStore = new RuntimeStore();
  readonly stateStore = new StateStore();
  readonly logStore = new LogStore();
  readonly eventStore = new EventStore();
  readonly runStore = new RunStore();
  readonly toolRegistry = new ToolRegistry();
  readonly approvalPolicyEngine = new ApprovalPolicyEngine();
  readonly taskWorktreeManager = new TaskWorktreeManager();
  readonly diffManager = new DiffManager();
  readonly instructionLoader = new InstructionLoader();
  readonly skillLoader = new SkillLoader();
  readonly approvalEngine = new ApprovalEngine(() => this.stateStore.readSettings());
  readonly taskStore = new TaskStore(this.stateStore);
  readonly taskBranchStore = new TaskBranchStore(this.stateStore);
  readonly contextCollector = new ContextCollector(this.diffManager, this.instructionLoader, this.skillLoader);
  readonly projectIndexer = new ProjectIndexer();
  readonly contextRetriever = new ContextRetriever(this.projectIndexer, this.instructionLoader, this.skillLoader);
  readonly patchEngine = new PatchEngine(this.stateStore, this.taskStore, this.taskBranchStore, this.approvalEngine, this.diffManager, this.logStore);
  readonly shellRunner = new ShellRunner(this.stateStore, this.approvalEngine, this.logStore);
  readonly uiScreenshotRunner = new UiScreenshotRunner(this.logStore);
  readonly router = new ExecutorRouter();
  readonly webAgentExecutor = new WebAgentExecutor();
  readonly hybridExecutor = new HybridExecutor();
  readonly externalExecutor = new ExternalExecutor();
  readonly codexExecutor = new CodexExecutor(this.runtimeStore, this.stateStore, this.approvalEngine, this.logStore);

  private createRun(input: { title: string; projectId?: string; taskId?: string; taskBranchId?: string; executorMode?: ExecutorMode; toolName?: string; requestId?: string; metadata?: Record<string, unknown> }) {
    const run = this.runStore.create(input);
    this.eventStore.append({
      runId: run.id,
      type: "run.created",
      projectId: input.projectId,
      taskId: input.taskId,
      taskBranchId: input.taskBranchId,
      executorMode: input.executorMode,
      toolName: input.toolName,
      requestId: input.requestId,
      message: `Run created: ${input.title}`,
      data: input.metadata
    });
    if (input.taskBranchId) {
      this.taskBranchStore.linkRun(input.taskBranchId, run.id);
    }
    return run;
  }

  private startRun(runId: string) {
    const run = this.runStore.start(runId);
    this.eventStore.append({
      runId,
      type: "run.started",
      projectId: run.projectId,
      taskId: run.taskId,
      taskBranchId: run.taskBranchId,
      executorMode: run.executorMode,
      toolName: run.toolName,
      requestId: run.requestId,
      message: "Run started."
    });
    return run;
  }

  private finishRun(runId: string, status: "completed" | "failed" | "waiting_for_approval" | "waiting_for_user", message: string, data?: unknown) {
    const run = this.runStore.setStatus(runId, status);
    this.eventStore.append({
      runId,
      type: status === "failed" ? "tool.failed" : "tool.completed",
      projectId: run.projectId,
      taskId: run.taskId,
      taskBranchId: run.taskBranchId,
      executorMode: run.executorMode,
      toolName: run.toolName,
      requestId: run.requestId,
      message,
      data
    });
    return run;
  }

  private appendRunEvent(input: { runId: string; type: RuntimeEventType; message: string; data?: unknown }) {
    const run = this.runStore.get(input.runId);
    return this.eventStore.append({
      runId: input.runId,
      type: input.type,
      projectId: run.projectId,
      taskId: run.taskId,
      taskBranchId: run.taskBranchId,
      executorMode: run.executorMode,
      toolName: run.toolName,
      requestId: run.requestId,
      message: input.message,
      data: input.data
    });
  }

  private createApprovalRequest(input: {
    method: string;
    params: unknown;
    projectId?: string;
    taskId?: string;
    taskBranchId?: string;
    runId?: string;
    toolName?: string;
    actionType?: ApprovalActionType;
    riskLevel?: ApprovalRequest["riskLevel"];
    patchId?: string;
    shellCommandId?: string;
    executionJobId?: string;
    repairProposalId?: string;
    affectedFiles?: string[];
    command?: string;
    suggestedDecision?: ApprovalRequest["suggestedDecision"];
    preflightReport?: ApprovalRequest["preflightReport"];
  }): ApprovalRequest {
    const approval: ApprovalRequest = {
      id: nanoid(10),
      method: input.method,
      params: input.params,
      projectId: input.projectId,
      taskId: input.taskId,
      taskBranchId: input.taskBranchId,
      runId: input.runId,
      toolName: input.toolName,
      actionType: input.actionType,
      riskLevel: input.riskLevel,
      patchId: input.patchId,
      shellCommandId: input.shellCommandId,
      executionJobId: input.executionJobId,
      repairProposalId: input.repairProposalId,
      affectedFiles: input.affectedFiles,
      command: input.command,
      suggestedDecision: input.suggestedDecision,
      preflightReport: input.preflightReport,
      status: "pending",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      events: [{ at: now(), type: "approval_required", message: `${input.method} requires approval.` }],
      createdAt: now(),
      updatedAt: now()
    };
    this.stateStore.update((state) => {
      state.approvalRequests.push(approval);
      if (input.taskId) {
        const task = state.tasks.find((item) => item.id === input.taskId);
        if (task) task.approvals.push(approval.id);
      }
      if (input.taskBranchId) {
        const branch = state.taskBranches.find((item) => item.id === input.taskBranchId);
        if (branch) branch.approvalIds.push(approval.id);
      }
    });
    if (input.runId) {
      this.appendRunEvent({ runId: input.runId, type: "approval.required", message: `${input.method} requires approval.`, data: approval });
      this.runStore.setStatus(input.runId, "waiting_for_approval");
    }
    return approval;
  }

  private projectForBranchWorkspace(project: Project, branch?: TaskBranchRecord): Project {
    if (!branch?.workspacePath || branch.workspacePath === project.path) return project;
    return { ...project, path: branch.workspacePath };
  }

  beginToolRun(toolName: string, args: unknown, requestId: string) {
    const metadata = this.toolRegistry.get(toolName);
    const typedArgs = args && typeof args === "object" ? args as Record<string, unknown> : {};
    const run = this.createRun({
      title: `MCP tool: ${toolName}`,
      projectId: typeof typedArgs.projectId === "string" ? typedArgs.projectId : undefined,
      taskId: typeof typedArgs.taskId === "string" ? typedArgs.taskId : undefined,
      taskBranchId: typeof typedArgs.taskBranchId === "string" ? typedArgs.taskBranchId : undefined,
      executorMode: typeof typedArgs.executorMode === "string" ? typedArgs.executorMode as ExecutorMode : undefined,
      toolName,
      requestId,
      metadata: { riskLevel: metadata?.riskLevel, sideEffects: metadata?.sideEffects }
    });
    this.startRun(run.id);
    this.appendRunEvent({ runId: run.id, type: "tool.called", message: `MCP tool called: ${toolName}`, data: args });
    return run;
  }

  completeToolRun(runId: string, result?: unknown) {
    const current = this.runStore.get(runId);
    if (["waiting_for_approval", "waiting_for_user", "cancelled"].includes(current.status)) {
      this.eventStore.append({
        runId,
        type: "tool.completed",
        projectId: current.projectId,
        taskId: current.taskId,
        taskBranchId: current.taskBranchId,
        executorMode: current.executorMode,
        toolName: current.toolName,
        requestId: current.requestId,
        message: "MCP tool completed; run remains in its current waiting/cancelled state.",
        data: result
      });
      return current;
    }
    const resultJobStatus = result && typeof result === "object" ? (result as { job?: { status?: string } }).job?.status : undefined;
    const resultCommandStatus = result && typeof result === "object" ? (result as { command?: { status?: string } }).command?.status : undefined;
    const pendingStatus = resultJobStatus || resultCommandStatus;
    if (pendingStatus === "queued") {
      const run = this.runStore.setStatus(runId, "queued");
      this.eventStore.append({
        runId,
        type: "tool.completed",
        projectId: current.projectId,
        taskId: current.taskId,
        taskBranchId: current.taskBranchId,
        executorMode: current.executorMode,
        toolName: current.toolName,
        requestId: current.requestId,
        message: "MCP tool completed; run remains queued for later execution.",
        data: result
      });
      return run;
    }
    return this.finishRun(runId, "completed", "MCP tool completed.", result);
  }

  failToolRun(runId: string, error: unknown) {
    return this.finishRun(runId, "failed", "MCP tool failed.", { error: error instanceof Error ? error.message : String(error) });
  }

  getBootstrap() {
    const runtime = this.runtimeStore.load();
    return {
      token: runtime.token,
      execution: runtime.execution,
      tokenPreview: runtime.token.slice(0, 4) + "...",
      note: "Local bootstrap is intended for the dashboard on this machine. Sensitive routes still require the local pairing code."
    };
  }

  getBridgeStatus() {
    const state = this.stateStore.load();
    const errors = this.logStore.list({ limit: 5, level: "error" });
    return {
      bridgeVersion: VERSION,
      runMode: this.runtimeStore.load().execution,
      permissionMode: state.settings.permissionMode,
      defaultExecutorMode: "webagent",
      executorPolicy: "save_codex_quota",
      projectsCount: state.projects.length,
      tasksCount: state.tasks.length,
      recentError: errors[0] || null,
      mcpPluginsSummary: this.getPluginSummary()
    };
  }

  getSetupGuide() {
    return {
      localDashboardUrl: `http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}/dashboard/`,
      localMcpUrl: `http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}/mcp`,
      cloudflareTunnelExample: "https://bridge.your-domain.com/mcp",
      authModeRecommendation: "Local pairing code",
      pairingCodeLabel: "Local pairing code",
      nodeVersionRequirement: `Node >= ${MIN_NODE_MAJOR}`,
      windowsPowerShellQuickStart: [
        "node -v",
        "cd .\\bridge",
        "npm.cmd install --no-audit --no-fund",
        "npm.cmd run dev",
        "Open http://localhost:8787/dashboard/ and copy the Local pairing code from Setup."
      ],
      chatgptCustomMcpSteps: [
        "Expose http://localhost:8787 with Cloudflare Tunnel or another HTTPS tunnel.",
        "In ChatGPT Custom MCP, set the server URL to https://your-domain/mcp.",
        "Choose Local pairing code and paste the value from the dashboard Setup screen.",
        "Start every new conversation by calling get_bridge_status, then bind to projectId, taskId, and taskBranchId when continuing work."
      ]
    };
  }

  getPluginSummary() {
    const pluginConfigs = new Map(this.stateStore.load().mcpPluginConfigs.map((item) => [item.id, item]));
    const plugins = MCP_PLUGINS.map((plugin) => {
      const saved = pluginConfigs.get(plugin.id);
      if (plugin.status === "built-in") {
        return {
          ...plugin,
          enabled: true,
          locked: true,
          actions: [],
          config: saved?.config || {}
        };
      }
      if (plugin.status === "not_implemented") {
        return {
          ...plugin,
          enabled: false,
          locked: true,
          actions: [],
          config: saved?.config || {}
        };
      }
      const enabled = Boolean(saved?.enabled);
      return {
        ...plugin,
        status: enabled ? "available" : "disabled",
        catalogStatus: plugin.status,
        enabled,
        locked: false,
        actions: enabled ? ["disable", "configure"] : ["enable", "configure"],
        config: saved?.config || {}
      };
    });
    return {
      total: plugins.length,
      builtIn: plugins.filter((plugin) => plugin.status === "built-in").length,
      available: plugins.filter((plugin) => plugin.status === "available").length,
      disabled: plugins.filter((plugin) => plugin.status === "disabled").length,
      notImplemented: plugins.filter((plugin) => plugin.status === "not_implemented").length,
      plugins
    };
  }

  getToolRegistry(input?: { category?: ToolMetadata["category"] }) {
    return { tools: this.toolRegistry.list(input?.category) };
  }

  getToolPolicy(input?: { toolName?: string }) {
    const settings = this.stateStore.readSettings();
    const tool = input?.toolName ? this.toolRegistry.get(input.toolName) : undefined;
    return {
      permissionMode: settings.permissionMode,
      rules: {
        read_only: "Allows file_read, context_index, and retrieve_context; blocks writes and external actions.",
        auto_review: "Allows file_read, context_index, retrieve_context, patch_draft, and shell_readonly; requires approval for patch_apply, shell_write, dependency_install, git_write, external_executor, network_access, worktree_create, and workspace_delete.",
        manual_review: "Allows low-risk preparation; requires approval for side effects.",
        full_access: "Allows actions but records audit warnings."
      },
      tool: tool ? {
        ...tool,
        policyDecision: this.approvalPolicyEngine.decide({
          mode: settings.permissionMode,
          actionType: tool.name === "request_apply_patch" ? "patch_apply" : tool.name === "run_shell_command" ? "shell_write" : tool.name === "create_execution_job" ? "external_executor" : "file_read",
          riskLevel: tool.riskLevel
        })
      } : undefined
    };
  }

  explainToolRisk(input: { toolName: string }) {
    return this.toolRegistry.explain(input.toolName);
  }

  listRuns(input?: { projectId?: string; taskId?: string; taskBranchId?: string; status?: any; limit?: number }) {
    return this.runStore.list(input);
  }

  getRun(runId: string) {
    return { run: this.runStore.get(runId), events: this.eventStore.list({ runId, limit: 300 }) };
  }

  getRunEvents(input: { runId?: string; projectId?: string; taskId?: string; taskBranchId?: string; requestId?: string; limit?: number }) {
    return this.eventStore.list(input);
  }

  cancelRun(input: { runId: string; reason?: string }) {
    const run = this.runStore.cancel(input.runId, input.reason);
    this.eventStore.append({
      runId: run.id,
      type: "run.cancelled",
      projectId: run.projectId,
      taskId: run.taskId,
      taskBranchId: run.taskBranchId,
      executorMode: run.executorMode,
      toolName: run.toolName,
      requestId: run.requestId,
      message: input.reason || "Run cancelled by user.",
      data: { limitation: "Current cancellation marks bridge state as cancelled. Long-running child process interruption is best-effort and executor-specific." }
    });
    this.stateStore.update((state) => {
      for (const job of state.executionJobs.filter((item) => item.runId === run.id && ["queued", "running", "needs_approval"].includes(item.status))) {
        job.status = "cancelled";
        job.updatedAt = now();
        job.events.push({ at: now(), type: "execution_cancelled", message: input.reason || "Run cancelled." });
      }
      for (const command of state.shellCommands.filter((item) => item.runId === run.id && ["queued", "running", "needs_approval"].includes(item.status))) {
        command.status = "cancelled";
        command.updatedAt = now();
        command.events.push({ at: now(), type: "command_cancelled", message: input.reason || "Run cancelled." });
      }
    });
    return { run, cancelled: true, limitation: "Process kill is best-effort; current executors persist cancellable state and document limitations." };
  }

  updateMcpPlugin(input: { pluginId: string; enabled?: boolean; config?: Record<string, unknown> }, requestId?: string) {
    const plugin = MCP_PLUGINS.find((item) => item.id === input.pluginId);
    if (!plugin) throw new Error("MCP plugin not found");
    if (plugin.status === "built-in" && input.enabled === false) {
      throw new Error("Built-in MCP plugins cannot be disabled.");
    }
    if (plugin.status === "not_implemented" && input.enabled === true) {
      throw new Error("This MCP plugin is planned but not implemented yet.");
    }
    const incomingConfig = input.config || {};
    for (const [key, value] of Object.entries(incomingConfig)) {
      const lowerKey = key.toLowerCase();
      if (["token", "apikey", "api_key", "secret", "password"].some((name) => lowerKey.includes(name)) && typeof value === "string" && !value.startsWith("env:")) {
        throw new Error("Plugin config must reference secrets as env:NAME instead of storing raw values.");
      }
    }
    const record = this.stateStore.update((state) => {
      const existing = state.mcpPluginConfigs.find((item) => item.id === plugin.id);
      const record: McpPluginRuntimeConfig = existing || {
        id: plugin.id,
        enabled: plugin.status === "built-in",
        config: {},
        updatedAt: now()
      };
      if (input.enabled !== undefined && plugin.status !== "built-in") {
        record.enabled = input.enabled;
      }
      record.config = { ...record.config, ...incomingConfig };
      record.updatedAt = now();
      if (!existing) state.mcpPluginConfigs.push(record);
      this.logStore.write({
        level: "info",
        source: "rest",
        action: "update_mcp_plugin",
        message: "MCP plugin runtime config updated.",
        requestId,
        details: { pluginId: plugin.id, enabled: record.enabled, configKeys: Object.keys(record.config) }
      });
      return record;
    });
    return { plugin: { ...plugin, enabled: record.enabled, config: record.config }, summary: this.getPluginSummary() };
  }

  getMcpToolCatalog() {
    return this.toolRegistry.list();
  }

  listProjects() {
    return this.stateStore.load().projects.sort((a, b) => a.name.localeCompare(b.name));
  }

  browseFolders(browsePath?: string) {
    return listBrowsableDirectories(browsePath);
  }

  selectProject(input: { path: string; displayName?: string; allowShell?: boolean }) {
    const resolvedPath = safeProjectPath(input.path);
    return this.stateStore.update((state) => {
      const existing = state.projects.find((project) => path.resolve(project.path).toLowerCase() === resolvedPath.toLowerCase());
      if (existing) {
        return { project: existing, created: false };
      }
      const project: Project = {
        id: nanoid(10),
        name: input.displayName || path.basename(resolvedPath) || resolvedPath,
        path: resolvedPath,
        allowShell: Boolean(input.allowShell),
        createdAt: now(),
        updatedAt: now()
      };
      state.projects.push(project);
      this.logStore.write({
        level: "info",
        source: "rest",
        action: "select_project",
        message: "Project registered in allowlist.",
        projectId: project.id,
        details: { path: project.path }
      });
      return { project, created: true };
    });
  }

  private getProject(projectId?: string): Project {
    const state = this.stateStore.load();
    const project = projectId ? state.projects.find((item) => item.id === projectId) : state.projects[0];
    if (!project) {
      throw new Error(projectId ? "project not found" : "no project registered yet");
    }
    return project;
  }

  getProjectRecord(projectId?: string): Project {
    return this.getProject(projectId);
  }

  async inspectProject(projectId?: string) {
    const project = this.getProject(projectId);
    const inspect = await this.contextCollector.inspectProject(project);
    return {
      ...inspect,
      readmePreview: findReadmePreview(project.path),
      instructions: inspect.instructions.map((item) => ({
        path: item.path,
        scope: item.scope,
        priority: item.priority,
        preview: item.preview
      })),
      techStack: inferTechStack(project.path)
    };
  }

  readFile(projectId: string, filePath: string) {
    const project = this.getProject(projectId);
    return readProjectFile(project, filePath);
  }

  private readGitHead(project: Project): string | undefined {
    const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd: project.path, env: process.env, encoding: "utf8" });
    if (result.status !== 0) {
      return undefined;
    }
    return String(result.stdout || "").trim() || undefined;
  }

  private contextBudgetConfig(budget: ContextPackBudget) {
    if (budget === "large") {
      return { maxFiles: 12, maxSnippets: 12 };
    }
    if (budget === "medium") {
      return { maxFiles: 8, maxSnippets: 8 };
    }
    return { maxFiles: 5, maxSnippets: 5 };
  }

  private enrichPatch(project: Project, patch: WebPatch) {
    return {
      ...patch,
      conflictStatus: this.patchEngine.getPatchConflictStatus(project, patch.id)
    };
  }

  private deriveTaskState(task: TaskRecord, branch: TaskBranchRecord | undefined): TaskRecord["status"] {
    if (["completed", "failed", "cancelled", "blocked"].includes(task.status)) {
      return task.status;
    }
    if (!branch) return "created";
    if (!branch.retrievedContextIds.length && !task.contextPackIds.length) return "context_index_required";
    if (task.patchIds.length && task.executionJobIds.length && task.executionJobIds.length >= task.patchIds.length) return "verifying";
    if (task.patchIds.length) return "patch_proposed";
    if (task.approvals.length) return "awaiting_approval";
    if (branch.retrievedContextIds.length || task.contextPackIds.length) return "context_ready";
    return "planning";
  }

  private recommendedNextAction(task: TaskRecord, branch: TaskBranchRecord | undefined) {
    const state = this.stateStore.load();
    const approvalsPending = state.executionJobs.some((job) => job.taskId === task.id && job.status === "needs_approval")
      || state.shellCommands.some((command) => command.taskId === task.id && command.status === "needs_approval")
      || state.webPatches.some((patch) => patch.taskId === task.id && patch.status === "needs_approval");
    const currentGitHead = this.getProjectRecord(task.projectId) ? this.readGitHead(this.getProjectRecord(task.projectId)) : undefined;
    const conflictDetected = branch
      ? this.taskBranchStore.detectConflicts({
          projectId: task.projectId,
          taskBranchId: branch.id,
          touchedFiles: branch.touchedFiles,
          baseGitHead: branch.baseGitHead,
          currentGitHead
        })
      : null;
    if (conflictDetected?.conflictingBranches.length || (conflictDetected?.baseGitHead && conflictDetected.currentGitHead && conflictDetected.baseGitHead !== conflictDetected.currentGitHead)) {
      return {
        recommendedNextAction: "detect_branch_conflicts",
        approvalNeeded: approvalsPending,
        conflictDetected: true,
        conflictSummary: conflictDetected
      };
    }
    if (approvalsPending) {
      return {
        recommendedNextAction: "resolve_pending_approvals",
        approvalNeeded: true,
        conflictDetected: false,
        conflictSummary: null
      };
    }
    if (!branch || !branch.retrievedContextIds.length) {
      return {
        recommendedNextAction: "retrieve_context",
        approvalNeeded: false,
        conflictDetected: false,
        conflictSummary: null
      };
    }
    if (!task.patchIds.length) {
      return {
        recommendedNextAction: "propose_web_patch",
        approvalNeeded: false,
        conflictDetected: false,
        conflictSummary: null
      };
    }
    if (task.patchIds.length && !task.executionJobIds.length) {
      return {
        recommendedNextAction: "request_apply_patch",
        approvalNeeded: false,
        conflictDetected: false,
        conflictSummary: null
      };
    }
    return {
      recommendedNextAction: "verify_or_repair",
      approvalNeeded: false,
      conflictDetected: false,
      conflictSummary: null
    };
  }

  async createContextPack(input: { projectId: string; taskId?: string; taskBranchId?: string; goal?: string; paths?: string[]; includeTree?: boolean; includeGitStatus?: boolean; includeDiff?: boolean; explicitFullRead?: boolean; budget?: ContextPackBudget }) {
    const project = this.getProject(input.projectId);
    const budget = input.budget || "small";
    const retrievalQuery = input.goal || input.paths?.join(" ") || "project context";
    const retrievedContext = input.explicitFullRead
      ? null
      : this.contextRetriever.retrieve(project, {
          query: retrievalQuery,
          purpose: input.goal || "Create a bounded context pack",
          includeRules: true,
          includeSkills: true,
          ...this.contextBudgetConfig(budget)
        });
    const { record, markdown } = await this.contextCollector.createContextPack(project, { ...input, budget, retrievedContext });
    this.stateStore.update((state) => {
      state.contextPacks.push(record);
    });
    if (input.taskId) {
      this.taskStore.linkArtifact(input.taskId, { id: record.id, type: "context_pack", label: "Context pack" });
    }
    if (input.taskBranchId) {
      this.taskBranchStore.linkArtifact(input.taskBranchId, { id: record.id, type: "context_pack", label: "Context pack", filePaths: input.paths || [] });
    }
    this.logStore.write({
      level: "info",
      source: "mcp",
      action: "create_context_pack",
      message: "Context pack created.",
      projectId: project.id,
      taskId: input.taskId,
      details: record.summary
    });
    return { contextPackId: record.id, filePath: record.filePath, summary: record.summary, markdown };
  }

  indexProject(input: { projectId: string; force?: boolean }) {
    const project = this.getProject(input.projectId);
    const manifest = this.projectIndexer.indexProject(project, Boolean(input.force));
    this.stateStore.update((state) => {
      const existing = state.projectIndexes.find((item) => item.projectId === project.id);
      if (existing) {
        Object.assign(existing, manifest);
      } else {
        state.projectIndexes.push(manifest);
      }
    });
    const run = this.createRun({ title: "Index project context", projectId: project.id, toolName: "index_project", metadata: { force: Boolean(input.force) } });
    this.finishRun(run.id, "completed", "Project context indexed.", manifest);
    this.eventStore.append({ runId: run.id, type: "context.indexed", projectId: project.id, toolName: "index_project", message: "Context index refreshed.", data: manifest });
    return manifest;
  }

  getIndexStatus(projectId: string): ProjectIndexRecord {
    const manifest = this.projectIndexer.getStatus(projectId);
    this.stateStore.update((state) => {
      const existing = state.projectIndexes.find((item) => item.projectId === projectId);
      if (existing) {
        Object.assign(existing, manifest, { updatedAt: now() });
      } else {
        state.projectIndexes.push(manifest);
      }
    });
    return manifest;
  }

  refreshContextIndex(projectId: string) {
    return this.indexProject({ projectId, force: true });
  }

  searchProject(input: { projectId: string; query: string; limit?: number }) {
    const project = this.getProject(input.projectId);
    const results = this.contextRetriever.retrieve(project, { query: input.query, maxFiles: input.limit, maxSnippets: input.limit, includeRules: false, includeSkills: false });
    return {
      query: input.query,
      provider: results.provider,
      warning: results.retrievalWarnings[0],
      results: results.snippets.map((snippet) => ({
        path: snippet.filePath,
        score: snippet.score,
        snippet: snippet.text,
        matchReason: snippet.reason
      }))
    };
  }

  retrieveContext(input: { projectId: string; taskId?: string; taskBranchId?: string; query: string; purpose?: string; maxFiles?: number; maxSnippets?: number; includeRules?: boolean; includeSkills?: boolean }) {
    const project = this.getProject(input.projectId);
    const payload = this.contextRetriever.retrieve(project, input);
    const record: RetrievedContextRecord = {
      ...payload,
      id: nanoid(10),
      taskId: input.taskId,
      taskBranchId: input.taskBranchId,
      createdAt: now(),
      updatedAt: now()
    };
    this.stateStore.update((state) => {
      state.retrievedContexts.push(record);
    });
    if (input.taskId) {
      this.taskStore.linkArtifact(input.taskId, {
        id: record.id,
        type: "retrieved_context",
        label: `Context retrieval: ${input.query}`,
        filePaths: record.relevantFiles
      });
    }
    if (input.taskBranchId) {
      this.taskBranchStore.linkArtifact(input.taskBranchId, {
        id: record.id,
        type: "retrieved_context",
        label: `Context retrieval: ${input.query}`,
        filePaths: record.relevantFiles
      });
      const branch = this.taskBranchStore.get(input.taskBranchId);
      if (branch.activeRunId) {
        this.appendRunEvent({ runId: branch.activeRunId, type: "context.retrieved", message: "Context retrieved for Task Branch.", data: { retrievedContextId: record.id, relevantFiles: record.relevantFiles } });
      }
    }
    return record;
  }

  createTask(input: { projectId: string; taskTitle?: string; taskGoal: string; executorMode?: ExecutorMode; executorPolicy?: ExecutorPolicy; targetFiles?: string[]; contextPaths?: string[]; relatedConversationHint?: string; createContextPack?: boolean; uiScreenshotRequest?: UiScreenshotRequest }) {
    const project = this.getProject(input.projectId);
    const targetFiles = (input.targetFiles || []).map((filePath) => assertSafeRelativePath(filePath));
    const routing = this.router.route({
      requestedMode: input.executorMode,
      requestedPolicy: input.executorPolicy,
      goal: input.taskGoal,
      targetFiles
    });
    const conflicts = this.taskStore.detectConflicts(project.id, targetFiles);
    const task = this.taskStore.create({
      projectId: project.id,
      taskTitle: input.taskTitle || input.taskGoal.slice(0, 60),
      taskGoal: input.taskGoal,
      status: "created",
      executorMode: routing.mode,
      executorPolicy: routing.policy,
      executorLocked: routing.locked,
      executorDecisionReason: routing.reasons.join(" "),
      taskBranchIds: [],
      contextPackIds: [],
      retrievedContextIds: [],
      patchIds: [],
      executionJobIds: [],
      shellCommandIds: [],
      approvals: [],
      logs: [],
      decisions: [{ at: now(), source: "router", summary: routing.reasons.join(" ") }],
      claimedFiles: targetFiles,
      relatedConversationHint: input.relatedConversationHint,
      chatTitleHint: input.relatedConversationHint || input.taskTitle || input.taskGoal.slice(0, 60),
      uiScreenshotRequest: input.uiScreenshotRequest,
      summary: routing.reasons.join(" "),
      recommendedNextAction: "retrieve_context",
      artifacts: [],
      conflicts
    });
    const branch = this.taskBranchStore.create({
      projectId: project.id,
      taskId: task.id,
      branchName: "main",
      branchGoal: task.taskGoal,
      chatTitleHint: task.chatTitleHint,
      status: "active",
      executorMode: task.executorMode,
      executorLocked: task.executorLocked,
      executorDecisionReason: task.executorDecisionReason,
      baseGitHead: this.readGitHead(project),
      currentGitHead: this.readGitHead(project),
      isolationMode: "in_place",
      worktreeStatus: "not_created",
      runIds: [],
      touchedFiles: targetFiles,
      patchIds: [],
      contextPackIds: [],
      retrievedContextIds: [],
      approvalIds: [],
      logRequestIds: []
    });
    this.taskStore.update(task.id, (current) => {
      current.taskBranchIds.push(branch.id);
      current.activeTaskBranchId = branch.id;
      current.status = this.deriveTaskState(current, branch);
      current.recommendedNextAction = this.recommendedNextAction(current, branch).recommendedNextAction;
    });
    this.logStore.write({
      level: conflicts.length ? "warn" : "info",
      source: "mcp",
      action: "create_task",
      message: conflicts.length ? "Task created with file conflict warnings." : "Task created.",
      projectId: project.id,
      taskId: task.id,
      details: { taskId: task.id, taskBranchId: branch.id, executorMode: task.executorMode, executorPolicy: task.executorPolicy, conflicts }
    });
    return { task: this.taskStore.get(task.id), defaultTaskBranch: branch, routing, conflicts, createContextPackSuggested: Boolean(input.contextPaths?.length || targetFiles.length || input.createContextPack) };
  }

  listTasks(projectId?: string) {
    return this.taskStore.list(projectId);
  }

  getTask(taskId: string) {
    const task = this.taskStore.get(taskId);
    const state = this.stateStore.load();
    return {
      task,
      taskBranches: state.taskBranches.filter((branch) => branch.taskId === task.id),
      contextPacks: state.contextPacks.filter((pack) => task.contextPackIds.includes(pack.id)),
      retrievedContexts: state.retrievedContexts.filter((item) => task.retrievedContextIds.includes(item.id)),
      patches: state.webPatches.filter((patch) => task.patchIds.includes(patch.id)).map((patch) => this.enrichPatch(this.getProject(patch.projectId), patch)),
      executionJobs: state.executionJobs.filter((job) => task.executionJobIds.includes(job.id)),
      shellCommands: state.shellCommands.filter((cmd) => task.shellCommandIds.includes(cmd.id))
    };
  }

  async continueTask(input: { taskId: string; taskBranchId?: string; note?: string; relatedConversationHint?: string; createContextPack?: boolean }) {
    const state = this.stateStore.load();
    const branches = state.taskBranches.filter((branch) => branch.taskId === input.taskId && branch.status === "active");
    if (!input.taskBranchId && branches.length > 1) {
      return {
        task: this.taskStore.get(input.taskId),
        needsBranchSelection: true,
        activeBranches: branches.map((branch) => ({
          taskBranchId: branch.id,
          branchName: branch.branchName,
          lastActiveAt: branch.lastActiveAt,
          executorMode: branch.executorMode
        }))
      };
    }
    const taskBranchId = input.taskBranchId || branches[0]?.id;
    const task = this.taskStore.update(input.taskId, (current) => {
      if (input.relatedConversationHint) current.relatedConversationHint = input.relatedConversationHint;
      if (input.note) current.summary = input.note;
    });
    const branch = taskBranchId ? this.taskBranchStore.update(taskBranchId, (current) => {
      if (input.relatedConversationHint) current.chatTitleHint = input.relatedConversationHint;
    }) : undefined;
    let contextPack: ContextPackRecord | null = null;
    if (input.createContextPack) {
      const created = await this.createContextPack({
        projectId: task.projectId,
        taskId: task.id,
        goal: task.taskGoal,
        paths: task.claimedFiles,
        includeTree: true,
        includeGitStatus: true,
        includeDiff: false
      });
      contextPack = this.stateStore.load().contextPacks.find((pack) => pack.id === created.contextPackId) || null;
      if (branch) {
        this.taskBranchStore.linkArtifact(branch.id, { id: created.contextPackId, type: "context_pack", label: "Context pack", filePaths: task.claimedFiles });
      }
    }
    const refreshedTask = this.taskStore.update(task.id, (current) => {
      current.status = this.deriveTaskState(current, branch);
      current.recommendedNextAction = this.recommendedNextAction(current, branch).recommendedNextAction;
      if (branch) current.activeTaskBranchId = branch.id;
    });
    const next = this.recommendedNextAction(refreshedTask, branch);
    return {
      task: refreshedTask,
      taskBranch: branch,
      contextPack,
      recommendedNextAction: next.recommendedNextAction,
      approvalNeeded: next.approvalNeeded,
      conflictDetected: next.conflictDetected,
      conflictSummary: next.conflictSummary
    };
  }

  createTaskBranch(input: { taskId: string; branchName?: string; branchGoal?: string; chatTitleHint?: string; touchedFiles?: string[] }) {
    const task = this.taskStore.get(input.taskId);
    const project = this.getProject(task.projectId);
    const branch = this.taskBranchStore.create({
      projectId: project.id,
      taskId: task.id,
      branchName: input.branchName || `branch-${task.taskBranchIds.length + 1}`,
      branchGoal: input.branchGoal || task.taskGoal,
      chatTitleHint: input.chatTitleHint || task.chatTitleHint,
      status: "active",
      executorMode: task.executorMode,
      executorLocked: task.executorLocked,
      executorDecisionReason: task.executorDecisionReason,
      executorSwitchReason: task.executorSwitchReason,
      baseGitHead: this.readGitHead(project),
      currentGitHead: this.readGitHead(project),
      isolationMode: "in_place",
      worktreeStatus: "not_created",
      runIds: [],
      touchedFiles: (input.touchedFiles || task.claimedFiles).map((filePath) => assertSafeRelativePath(filePath)),
      patchIds: [],
      contextPackIds: [],
      retrievedContextIds: [],
      approvalIds: [],
      logRequestIds: []
    });
    this.taskStore.update(task.id, (current) => {
      current.taskBranchIds.push(branch.id);
      current.activeTaskBranchId = branch.id;
    });
    return branch;
  }

  listTaskBranches(input: { projectId?: string; taskId?: string }) {
    return this.taskBranchStore.list(input.projectId, input.taskId);
  }

  getTaskBranch(taskBranchId: string) {
    const branch = this.taskBranchStore.get(taskBranchId);
    const state = this.stateStore.load();
    return {
      branch,
      task: this.taskStore.get(branch.taskId),
      contextPacks: state.contextPacks.filter((pack) => branch.contextPackIds.includes(pack.id)),
      retrievedContexts: state.retrievedContexts.filter((item) => branch.retrievedContextIds.includes(item.id)),
      patches: state.webPatches.filter((patch) => branch.patchIds.includes(patch.id)).map((patch) => this.enrichPatch(this.getProject(patch.projectId), patch))
    };
  }

  async continueTaskBranch(input: { taskBranchId: string; note?: string; createContextPack?: boolean }) {
    const branch = this.taskBranchStore.get(input.taskBranchId);
    const run = this.createRun({ title: `Continue Task Branch: ${branch.branchName}`, projectId: branch.projectId, taskId: branch.taskId, taskBranchId: branch.id, executorMode: branch.executorMode, toolName: "continue_task_branch", metadata: { note: input.note, createContextPack: input.createContextPack } });
    this.startRun(run.id);
    const result = await this.continueTask({
      taskId: branch.taskId,
      taskBranchId: branch.id,
      note: input.note,
      createContextPack: input.createContextPack
    });
    const nextStatus = result.approvalNeeded ? "waiting_for_approval" : result.recommendedNextAction === "retrieve_context" ? "waiting_for_user" : "completed";
    this.finishRun(run.id, nextStatus, `Continue Task Branch finished: ${result.recommendedNextAction}`, result);
    return { ...result, runId: run.id, timeline: this.eventStore.list({ runId: run.id, limit: 100 }) };
  }

  renameTaskBranch(input: { taskBranchId: string; branchName: string; chatTitleHint?: string }) {
    return this.taskBranchStore.update(input.taskBranchId, (branch) => {
      branch.branchName = input.branchName.trim() || branch.branchName;
      if (input.chatTitleHint) branch.chatTitleHint = input.chatTitleHint;
    });
  }

  archiveTaskBranch(taskBranchId: string) {
    return this.taskBranchStore.update(taskBranchId, (branch) => {
      branch.status = "archived";
    });
  }

  setActiveTaskBranch(input: { taskId: string; taskBranchId: string }) {
    const branch = this.taskBranchStore.get(input.taskBranchId);
    if (branch.taskId !== input.taskId) throw new Error("task branch does not belong to the task");
    return this.taskStore.update(input.taskId, (task) => {
      task.activeTaskBranchId = branch.id;
    });
  }

  detectBranchConflicts(input: { taskBranchId: string }) {
    const branch = this.taskBranchStore.get(input.taskBranchId);
    const project = this.getProject(branch.projectId);
    return this.taskBranchStore.detectConflicts({
      projectId: branch.projectId,
      taskBranchId: branch.id,
      touchedFiles: branch.touchedFiles,
      baseGitHead: branch.baseGitHead,
      currentGitHead: this.readGitHead(project)
    });
  }

  recommendIsolationMode(input: { taskBranchId?: string; executorMode?: ExecutorMode; touchedFiles?: string[]; riskHint?: "low" | "medium" | "high" }) {
    const branch = input.taskBranchId ? this.taskBranchStore.get(input.taskBranchId) : undefined;
    const project = branch ? this.getProject(branch.projectId) : undefined;
    const executorMode = branch?.executorMode || input.executorMode || "webagent";
    const touchedFiles = branch?.touchedFiles || input.touchedFiles || [];
    const isGitRepo = project ? this.taskWorktreeManager.isGitRepo(project.path) : false;
    return {
      taskBranchId: branch?.id,
      executorMode,
      touchedFiles,
      isGitRepo,
      ...this.taskWorktreeManager.recommend({ executorMode, touchedFiles, isGitRepo, riskHint: input.riskHint })
    };
  }

  createTaskWorktree(input: { taskBranchId: string; isolationMode?: "in_place" | "git_worktree" | "copy_workspace" }, requestId?: string, runId?: string) {
    const branch = this.taskBranchStore.get(input.taskBranchId);
    const project = this.getProject(branch.projectId);
    const metadata = this.toolRegistry.get("create_task_worktree");
    const decision = this.approvalPolicyEngine.decide({ mode: this.stateStore.readSettings().permissionMode, actionType: "worktree_create", riskLevel: metadata?.riskLevel });
    if (decision.requiresApproval && this.stateStore.readSettings().permissionMode !== "full_access") {
      const approval = this.createApprovalRequest({
        method: "create_task_worktree",
        params: input,
        projectId: branch.projectId,
        taskId: branch.taskId,
        taskBranchId: branch.id,
        runId,
        toolName: "create_task_worktree",
        actionType: "worktree_create",
        riskLevel: metadata?.riskLevel,
        affectedFiles: branch.touchedFiles,
        suggestedDecision: "inspect"
      });
      return { created: false, approvalRequired: true, approvalId: approval.id, decision };
    }
    const created = this.taskWorktreeManager.createWorkspace(project, branch, input.isolationMode);
    const updated = this.taskBranchStore.update(branch.id, (current) => {
      current.isolationMode = created.isolationMode;
      current.workspacePath = created.workspacePath;
      current.gitBranchName = created.gitBranchName || current.gitBranchName;
      current.worktreeCreatedAt = created.createdAt;
      current.worktreeStatus = created.worktreeStatus;
    });
    if (runId) {
      this.appendRunEvent({ runId, type: "tool.completed", message: created.message, data: created });
    }
    this.logStore.write({ level: created.worktreeStatus === "ready" ? "info" : "warn", source: "mcp", action: "create_task_worktree", message: created.message, requestId, projectId: project.id, taskId: branch.taskId, taskBranchId: branch.id, runId, details: created });
    return { created: created.worktreeStatus === "ready", taskBranch: updated, worktree: created, approvalRequired: false };
  }

  getTaskWorktreeStatus(taskBranchId: string) {
    const branch = this.taskBranchStore.get(taskBranchId);
    const project = this.getProject(branch.projectId);
    return this.taskWorktreeManager.status(project, branch);
  }

  cleanupTaskWorktree(input: { taskBranchId: string; confirm: boolean }, requestId?: string, runId?: string) {
    if (!input.confirm) throw new Error("confirm must be true to cleanup a task workspace");
    const branch = this.taskBranchStore.get(input.taskBranchId);
    const project = this.getProject(branch.projectId);
    const result = this.taskWorktreeManager.cleanup(project, branch);
    const updated = this.taskBranchStore.update(branch.id, (current) => {
      current.worktreeStatus = result.cleaned ? "cleaned_up" : current.worktreeStatus;
      if (result.cleaned) current.workspacePath = undefined;
    });
    if (runId) {
      this.appendRunEvent({ runId, type: "tool.completed", message: result.message, data: result });
    }
    this.logStore.write({ level: "warn", source: "mcp", action: "cleanup_task_worktree", message: result.message, requestId, projectId: project.id, taskId: branch.taskId, taskBranchId: branch.id, runId, details: result });
    return { taskBranch: updated, result };
  }

  proposeWebPatch(input: { projectId: string; taskId?: string; taskBranchId?: string; title: string; rationale?: string; changes: WebPatch["changes"] }, requestId?: string) {
    const project = this.getProject(input.projectId);
    const patch = this.patchEngine.create(project, input, requestId);
    if (input.taskBranchId) {
        this.taskBranchStore.linkArtifact(input.taskBranchId, { id: patch.id, type: "patch", label: patch.title, filePaths: patch.changes.map((change) => change.filePath) });
      const branch = this.taskBranchStore.get(input.taskBranchId);
      if (branch.activeRunId) {
        this.appendRunEvent({ runId: branch.activeRunId, type: "patch.proposed", message: `Patch proposed: ${patch.title}`, data: { patchId: patch.id, touchedFiles: patch.touchedFiles } });
      }
    }
    return patch;
  }

  getPatchDiff(patchId: string) {
    const patch = this.patchEngine.get(patchId);
    const project = this.getProject(patch.projectId);
    return this.patchEngine.diff(project, patchId);
  }

  getPatchConflictStatus(patchId: string) {
    const patch = this.patchEngine.get(patchId);
    const project = this.getProject(patch.projectId);
    return this.patchEngine.getPatchConflictStatus(project, patchId);
  }

  preflightPatchApply(patchId: string, runId?: string) {
    const patch = this.patchEngine.get(patchId);
    const project = this.getProject(patch.projectId);
    const branch = patch.taskBranchId ? this.taskBranchStore.get(patch.taskBranchId) : undefined;
    const targetProject = this.projectForBranchWorkspace(project, branch);
    const preflightReport = this.patchEngine.preflightPatchApply(targetProject, patchId);
    if (runId) {
      this.appendRunEvent({ runId, type: "patch.preflight_checked", message: preflightReport.preflightSummary, data: preflightReport });
      if (preflightReport.conflictDetected) {
        this.appendRunEvent({ runId, type: "conflict.detected", message: "Patch preflight detected conflict or stale base.", data: preflightReport });
      }
    }
    return preflightReport;
  }

  requestApplyPatch(patchId: string, requestId?: string, runId?: string) {
    const patch = this.patchEngine.get(patchId);
    const project = this.getProject(patch.projectId);
    const branch = patch.taskBranchId ? this.taskBranchStore.get(patch.taskBranchId) : undefined;
    const targetProject = this.projectForBranchWorkspace(project, branch);
    const result = this.patchEngine.requestApply(targetProject, patchId, requestId);
    const preflightReport = (result as any).preflightReport || (result as any).conflictStatus;
    if (runId && preflightReport) {
      this.appendRunEvent({ runId, type: "patch.preflight_checked", message: preflightReport.preflightSummary || "Patch preflight checked.", data: preflightReport });
      if (preflightReport.conflictDetected) {
        this.appendRunEvent({ runId, type: "conflict.detected", message: "Patch conflict detected.", data: preflightReport });
      }
    }
    if ((result as any).requiresApproval || (result as any).approvalRequired) {
      const metadata = this.toolRegistry.get("request_apply_patch");
      const approval = this.createApprovalRequest({
        method: "request_apply_patch",
        params: { patchId },
        projectId: patch.projectId,
        taskId: patch.taskId,
        taskBranchId: patch.taskBranchId,
        runId,
        toolName: "request_apply_patch",
        actionType: "patch_apply",
        riskLevel: metadata?.riskLevel,
        patchId: patch.id,
        affectedFiles: patch.touchedFiles,
        suggestedDecision: preflightReport?.conflictDetected ? "inspect" : "approve",
        preflightReport
      });
      return { ...result, approvalRequired: true, approvalId: approval.id, preflightReport };
    }
    if (runId) {
      this.appendRunEvent({ runId, type: "patch.applied", message: "Patch applied.", data: result });
    }
    return result;
  }

  requestRevertPatch(patchId: string, requestId?: string, runId?: string) {
    const patch = this.patchEngine.get(patchId);
    const project = this.getProject(patch.projectId);
    const branch = patch.taskBranchId ? this.taskBranchStore.get(patch.taskBranchId) : undefined;
    const targetProject = this.projectForBranchWorkspace(project, branch);
    const result = this.patchEngine.requestRevert(targetProject, patchId, requestId);
    if ((result as any).reverted === false || (result as any).requiresApproval) {
      const metadata = this.toolRegistry.get("request_revert_patch");
      const approval = this.createApprovalRequest({
        method: "request_revert_patch",
        params: { patchId },
        projectId: patch.projectId,
        taskId: patch.taskId,
        taskBranchId: patch.taskBranchId,
        runId,
        toolName: "request_revert_patch",
        actionType: "patch_revert",
        riskLevel: metadata?.riskLevel,
        patchId: patch.id,
        affectedFiles: patch.touchedFiles,
        suggestedDecision: "inspect"
      });
      return { ...result, approvalRequired: true, approvalId: approval.id };
    }
    if (runId) {
      this.appendRunEvent({ runId, type: "patch.reverted", message: "Patch reverted.", data: result });
    }
    return result;
  }

  applyPatchFromDashboard(patchId: string, requestId?: string) {
    const patch = this.patchEngine.get(patchId);
    const project = this.getProject(patch.projectId);
    return this.patchEngine.apply(project, patchId, "dashboard", requestId);
  }

  revertPatchFromDashboard(patchId: string, requestId?: string) {
    const patch = this.patchEngine.get(patchId);
    const project = this.getProject(patch.projectId);
    return this.patchEngine.revert(project, patchId, "dashboard", requestId);
  }

  rejectPatch(patchId: string, reason?: string) {
    return this.patchEngine.reject(patchId, reason);
  }

  private buildPacket(task: TaskRecord, project: Project): ExecutorPacket {
    const instructionFiles = this.instructionLoader.load(project.path, task.claimedFiles);
    const skills = this.skillLoader.list(project.path, [task.taskGoal, task.taskTitle]);
    const roles = fs.existsSync(ROLE_DIR) ? fs.readdirSync(ROLE_DIR).filter((name) => name.endsWith(".md")).map((name) => name.replace(/\.md$/, "")) : [];
    const referencedRoles = roles.filter((role) => {
      const lower = role.toLowerCase();
      return task.taskGoal.toLowerCase().includes(lower) || ["fullstack_engineer", "frontend_engineer", "backend_engineer", "qa_reviewer"].includes(role);
    }).slice(0, 6);
    const referencedSkills = skills.map((skill) => skill.id).slice(0, 8);
    const contextSummary = [
      `Task goal: ${task.taskGoal}`,
      task.claimedFiles.length ? `Target files: ${task.claimedFiles.join(", ")}` : "Target files: not declared",
      instructionFiles.length ? `Rule files: ${instructionFiles.map((item) => path.basename(item.path)).join(", ")}` : "Rule files: none detected",
      skills.length ? `Candidate skills: ${skills.slice(0, 5).map((skill) => skill.id).join(", ")}` : "Candidate skills: none matched"
    ].join("\n");
    return {
      projectPath: project.path,
      taskGoal: task.taskGoal,
      relevantContextSummary: contextSummary,
      constraints: [
        "Stay inside the registered project root.",
        "Respect the current bridge permission mode.",
        "Do not assume code layout before reading project context."
      ],
      expectedOutput: [
        "Changed files or a concrete no-change reason.",
        "Diff summary.",
        "Commands run and test results.",
        "Risks or blockers.",
        "Recommended next step."
      ],
      safetyNote: "Dangerous writes, dependency installs, and git pushes must stay behind bridge approval boundaries.",
      referencedRoles,
      referencedSkills
    };
  }

  private inferSafetyLevel(task: TaskRecord): number {
    const goal = task.taskGoal.toLowerCase();
    if (goal.includes("install") || goal.includes("migration") || goal.includes("dependency") || goal.includes("deploy")) {
      return 4;
    }
    if (task.executorMode === "codex" || task.executorMode === "hybrid") {
      return 3;
    }
    return 2;
  }

  listExecutionJobs() {
    return this.stateStore.load().executionJobs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async createExecutionJob(input: { taskId: string; taskBranchId?: string; executorMode?: ExecutorMode; executorPolicy?: ExecutorPolicy; externalExecutorId?: string; runImmediately?: boolean }, requestId?: string, incomingRunId?: string) {
    const task = this.taskStore.get(input.taskId);
    const project = this.getProject(task.projectId);
    const taskBranchId = input.taskBranchId || task.activeTaskBranchId;
    const branch = taskBranchId ? this.taskBranchStore.get(taskBranchId) : undefined;
    const packet = this.buildPacket(task, project);
    const executorMode = input.executorMode || task.executorMode;
    const executorPolicy = input.executorPolicy || task.executorPolicy;
    const safetyLevel = this.inferSafetyLevel(task);
    const requiresApproval = executorMode === "webagent" || executorMode === "external"
      ? false
      : this.approvalEngine.requiresApprovalForExecution(safetyLevel);
    const prompt = executorMode === "codex" || executorMode === "hybrid"
      ? this.codexExecutor.buildPrompt(task, project, packet.relevantContextSummary, packet.referencedRoles, packet.referencedSkills)
      : undefined;
    const run = incomingRunId
      ? this.runStore.update(incomingRunId, (current) => {
          current.projectId = project.id;
          current.taskId = task.id;
          current.taskBranchId = taskBranchId;
          current.executorMode = executorMode;
          current.title = `Execution job: ${task.taskTitle}`;
        })
      : this.createRun({ title: `Execution job: ${task.taskTitle}`, projectId: project.id, taskId: task.id, taskBranchId, executorMode, toolName: "create_execution_job", requestId });
    if (taskBranchId) {
      this.taskBranchStore.linkRun(taskBranchId, run.id);
    }
    this.appendRunEvent({ runId: run.id, type: "executor.selected", message: `Executor selected: ${executorMode}`, data: { executorPolicy, branchIsolation: branch?.isolationMode } });
    const job: ExecutionJob = {
      id: nanoid(10),
      projectId: project.id,
      taskId: task.id,
      taskBranchId,
      runId: run.id,
      title: `${task.taskTitle} (${executorMode})`,
      executorMode,
      executorPolicy,
      status: requiresApproval ? "needs_approval" : "queued",
      safetyLevel,
      requiresApproval,
      prompt,
      packet,
      externalExecutorId: input.externalExecutorId,
      artifacts: [],
      events: [{ at: now(), type: "execution_job_created", message: requiresApproval ? "Waiting for approval." : "Execution job queued." }],
      createdAt: now(),
      updatedAt: now()
    };
    this.stateStore.update((state) => {
      state.executionJobs.push(job);
    });
    this.taskStore.linkArtifact(task.id, { id: job.id, type: "execution_job", label: job.title });
    if (taskBranchId) {
      this.taskBranchStore.linkArtifact(taskBranchId, { id: job.id, type: "execution_job", label: job.title, filePaths: task.claimedFiles });
    }
    this.logStore.write({
      level: "info",
      source: "mcp",
      action: "create_execution_job",
      message: "Execution job created.",
      requestId,
      projectId: project.id,
      taskId: task.id,
      taskBranchId,
      runId: run.id,
      details: { jobId: job.id, executorMode, executorPolicy, requiresApproval }
    });
    if (requiresApproval) {
      const metadata = this.toolRegistry.get("create_execution_job");
      const approval = this.createApprovalRequest({
        method: "create_execution_job",
        params: { jobId: job.id, taskId: task.id, taskBranchId, executorMode },
        projectId: project.id,
        taskId: task.id,
        taskBranchId,
        runId: run.id,
        toolName: "create_execution_job",
        actionType: executorMode === "external" ? "external_executor" : "patch_apply",
        riskLevel: metadata?.riskLevel,
        executionJobId: job.id,
        affectedFiles: task.claimedFiles,
        suggestedDecision: "inspect"
      });
      return { job, runId: run.id, approvalRequired: true, approvalId: approval.id };
    }
    if (input.runImmediately && !requiresApproval) {
      return this.runExecutionJob(job.id, requestId);
    }
    return { job, runId: run.id, approvalRequired: false };
  }

  getExecutionJob(jobId: string) {
    const job = this.stateStore.load().executionJobs.find((item) => item.id === jobId);
    if (!job) throw new Error("execution job not found");
    return job;
  }

  async runExecutionJob(jobId: string, requestId?: string) {
    const state = this.stateStore.load();
    const job = state.executionJobs.find((item) => item.id === jobId);
    if (!job) throw new Error("execution job not found");
    const task = job.taskId ? this.taskStore.get(job.taskId) : this.taskStore.create({
      projectId: job.projectId,
      taskTitle: job.title,
      taskGoal: job.packet?.taskGoal || job.title,
      status: "planning",
      executorMode: job.executorMode,
      executorPolicy: job.executorPolicy,
      executorLocked: true,
      executorDecisionReason: "Created implicitly from an execution job.",
      taskBranchIds: [],
      contextPackIds: [],
      retrievedContextIds: [],
      patchIds: [],
      executionJobIds: [job.id],
      shellCommandIds: [],
      approvals: [],
      logs: [],
      decisions: [{ at: now(), source: "system", summary: "Created implicitly from execution job." }],
      claimedFiles: [],
      recommendedNextAction: "verify_or_repair",
      artifacts: []
    });
    const project = this.getProject(job.projectId);
    const executor = job.executorMode === "webagent"
      ? this.webAgentExecutor
      : job.executorMode === "hybrid"
        ? this.hybridExecutor
        : job.executorMode === "external"
          ? this.externalExecutor
          : this.codexExecutor;

    this.stateStore.update((current) => {
      const target = current.executionJobs.find((item) => item.id === jobId);
      if (!target) throw new Error("execution job not found");
      target.status = "running";
      target.updatedAt = now();
      target.events.push({ at: now(), type: "execution_started", message: `Executor ${target.executorMode} started.` });
    });
    if (job.runId) {
      this.runStore.start(job.runId);
      this.appendRunEvent({ runId: job.runId, type: "executor.started", message: `Executor ${job.executorMode} started.`, data: { jobId } });
    }
    const result = task.uiScreenshotRequest
      ? await this.uiScreenshotRunner.run(job, task, project, requestId)
      : await executor.run(job, task, project);
    const updated = this.stateStore.update((current) => {
      const target = current.executionJobs.find((item) => item.id === jobId);
      if (!target) throw new Error("execution job not found");
      target.status = result.status || (result.exitCode === 0 ? "completed" : "failed");
      target.result = result.result;
      target.stdout = result.stdout;
      target.stderr = result.stderr;
      target.exitCode = result.exitCode ?? null;
      target.error = result.error;
      target.artifacts = Array.isArray(result.artifacts) ? result.artifacts : target.artifacts;
      target.updatedAt = now();
      target.events.push({ at: now(), type: "execution_finished", message: `Executor ${target.executorMode} finished with ${target.exitCode ?? "n/a"}.` });
      if (target.taskId) {
        this.taskStore.update(target.taskId, (taskRecord) => {
          taskRecord.status = target.status === "completed" ? "completed" : target.status === "cancelled" ? "cancelled" : target.status === "failed" ? "needs_repair" : "verifying";
          taskRecord.recommendedNextAction = target.status === "failed" ? "create_repair_proposal" : "verify_or_repair";
        });
      }
      this.logStore.write({
        level: target.exitCode === 0 || target.executorMode === "webagent" || target.executorMode === "hybrid" || target.executorMode === "external" ? "info" : "error",
        source: target.executorMode,
        action: "run_execution_job",
        message: `Execution job finished: ${target.status}`,
        requestId,
        projectId: target.projectId,
        taskId: target.taskId,
        taskBranchId: target.taskBranchId,
        runId: target.runId,
        details: { jobId: target.id, exitCode: target.exitCode }
      });
      if (target.runId) {
        this.runStore.setStatus(target.runId, target.status === "completed" ? "completed" : target.status === "cancelled" ? "cancelled" : "failed");
        this.eventStore.append({
          runId: target.runId,
          type: target.status === "completed" ? "executor.completed" : "executor.failed",
          projectId: target.projectId,
          taskId: target.taskId,
          taskBranchId: target.taskBranchId,
          executorMode: target.executorMode,
          toolName: "create_execution_job",
          requestId,
          message: `Executor ${target.executorMode} finished with ${target.status}.`,
          data: { jobId: target.id, exitCode: target.exitCode }
        });
      }
      return { job: target };
    });
    if (updated.job.taskId && Array.isArray(result.artifacts)) {
      for (const artifact of result.artifacts) {
        this.taskStore.linkArtifact(updated.job.taskId, artifact);
      }
    }
    return { job: this.getExecutionJob(jobId) };
  }

  approveExecutionJob(jobId: string) {
    return this.stateStore.update((state) => {
      const job = state.executionJobs.find((item) => item.id === jobId);
      if (!job) throw new Error("execution job not found");
      job.approvedAt = now();
      job.status = "queued";
      job.updatedAt = now();
      job.events.push({ at: now(), type: "execution_approved", message: "Execution job approved by user." });
      return job;
    });
  }

  async runShellCommand(input: { projectId: string; taskId?: string; taskBranchId?: string; command: string; cwd?: string; timeoutMs?: number; shell?: "powershell" | "cmd" | "bash"; runImmediately?: boolean }, requestId?: string, incomingRunId?: string) {
    const project = this.getProject(input.projectId);
    const branch = input.taskBranchId ? this.taskBranchStore.get(input.taskBranchId) : undefined;
    const targetProject = this.projectForBranchWorkspace(project, branch);
    const run = incomingRunId
      ? this.runStore.update(incomingRunId, (current) => {
          current.projectId = project.id;
          current.taskId = input.taskId;
          current.taskBranchId = input.taskBranchId;
          current.title = `Shell command: ${input.command.slice(0, 80)}`;
        })
      : this.createRun({ title: `Shell command: ${input.command.slice(0, 80)}`, projectId: project.id, taskId: input.taskId, taskBranchId: input.taskBranchId, toolName: "run_shell_command", requestId });
    const command = this.shellRunner.create(targetProject, { ...input, runId: run.id }, requestId);
    if (input.taskId) {
      this.taskStore.linkArtifact(input.taskId, { id: command.id, type: "shell_command", label: command.command });
    }
    if (input.taskBranchId) {
      this.taskBranchStore.linkArtifact(input.taskBranchId, { id: command.id, type: "shell_command", label: command.command });
    }
    if (command.requiresApproval) {
      const metadata = this.toolRegistry.get("run_shell_command");
      const approval = this.createApprovalRequest({
        method: "run_shell_command",
        params: { commandId: command.id, command: command.command },
        projectId: project.id,
        taskId: input.taskId,
        taskBranchId: input.taskBranchId,
        runId: run.id,
        toolName: "run_shell_command",
        actionType: command.classification === "read_only" ? "shell_readonly" : "shell_write",
        riskLevel: metadata?.riskLevel,
        shellCommandId: command.id,
        command: command.command,
        suggestedDecision: command.classification === "dangerous" ? "reject" : "inspect"
      });
      return { command, runId: run.id, approvalRequired: true, approvalId: approval.id };
    }
    if (input.runImmediately && !command.requiresApproval) {
      this.appendRunEvent({ runId: run.id, type: "shell.started", message: "Shell command started.", data: { commandId: command.id } });
      const result = await this.shellRunner.run(command.id, requestId);
      this.runStore.setStatus(run.id, result.status === "completed" ? "completed" : "failed");
      this.appendRunEvent({ runId: run.id, type: result.status === "completed" ? "shell.completed" : "shell.failed", message: `Shell command ${result.status}.`, data: { commandId: result.id, exitCode: result.exitCode } });
      return { command: result, runId: run.id, approvalRequired: false };
    }
    return { command, runId: run.id, approvalRequired: false };
  }

  approveShellCommand(commandId: string) {
    return this.shellRunner.approve(commandId);
  }

  async getLatestLogs(input: { level?: "debug" | "info" | "warn" | "error"; requestId?: string; limit?: number; projectId?: string; taskId?: string; taskBranchId?: string; runId?: string }) {
    return this.logStore.list(input);
  }

  analyzeErrorLog(input: { requestId?: string; logId?: string }) {
    const logs = this.logStore.list({ level: "error", limit: 300 });
    const log = logs.find((entry) => (input.logId && entry.id === input.logId) || (input.requestId && entry.requestId === input.requestId)) || logs[0];
    if (!log) throw new Error("no error logs found");
    const detailsText = typeof log.details === "string" ? log.details : JSON.stringify(log.details || {});
    const message = log.message || "Unknown error";
    const likelyCause = message.toLowerCase().includes("unauthorized")
      ? "The local pairing code is missing or incorrect."
      : message.toLowerCase().includes("project not found")
        ? "The selected project id is missing or the project was removed."
        : message.toLowerCase().includes("path")
          ? "The requested path is missing, outside the project root, or blocked by safety rules."
          : "Inspect the matching requestId in logs and compare it with the current project/task state.";
    return {
      requestId: log.requestId,
      logId: log.id,
      action: log.action,
      errorSummary: message,
      likelyCause,
      evidence: detailsText.slice(0, 1500),
      suggestedNextActions: [
        "Open Dashboard > Logs and search this requestId.",
        "If setup or project selection is wrong, fix that before changing code.",
        "If code changes are required, create a repair proposal and wait for approval."
      ]
    };
  }

  createRepairProposal(input: { projectId?: string; taskId?: string; sourceRequestId?: string; sourceLogId?: string; sourceKind?: RepairProposal["sourceKind"]; errorSummary: string; conciseDiagnosis: string; solution: string; executionPlan: string[]; codexTask?: string; safetyLevel?: number }) {
    const repair: RepairProposal = {
      id: nanoid(10),
      projectId: input.projectId,
      taskId: input.taskId,
      sourceRequestId: input.sourceRequestId,
      sourceLogId: input.sourceLogId,
      sourceKind: input.sourceKind || "manual",
      errorSummary: input.errorSummary,
      conciseDiagnosis: input.conciseDiagnosis,
      solution: input.solution,
      executionPlan: input.executionPlan,
      codexTask: input.codexTask,
      safetyLevel: Math.max(1, Math.min(5, Number(input.safetyLevel || 2))),
      status: "needs_approval",
      createdBy: "chatgpt-web",
      events: [{ at: now(), type: "repair_created", message: "Repair proposal created and waiting for approval." }],
      createdAt: now(),
      updatedAt: now()
    };
    this.stateStore.update((state) => {
      state.repairProposals.push(repair);
    });
    return repair;
  }

  approveRepairProposal(repairId: string) {
    return this.stateStore.update((state) => {
      const repair = state.repairProposals.find((item) => item.id === repairId);
      if (!repair) throw new Error("repair proposal not found");
      repair.status = "approved";
      repair.updatedAt = now();
      repair.events.push({ at: now(), type: "repair_approved", message: "Repair proposal approved." });
      return repair;
    });
  }

  listRepairs() {
    return this.stateStore.load().repairProposals.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getApprovals() {
    const state = this.stateStore.load();
    return {
      approvalRequests: state.approvalRequests.filter((approval) => approval.status === "pending"),
      executionJobs: state.executionJobs.filter((job) => job.status === "needs_approval"),
      shellCommands: state.shellCommands.filter((command) => command.status === "needs_approval"),
      repairs: state.repairProposals.filter((repair) => repair.status === "needs_approval"),
      patches: state.webPatches
        .filter((patch) => patch.status === "needs_approval")
        .map((patch) => this.enrichPatch(this.getProject(patch.projectId), patch))
    };
  }

  listPatches() {
    return this.patchEngine.list().map((patch) => this.enrichPatch(this.getProject(patch.projectId), patch));
  }

  listReviews() {
    return this.stateStore.load().reviewSessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  createCrossReview(input: { projectId: string; taskId?: string; title: string; webPatchId?: string; executionJobId?: string; webSummary?: string; codexSummary?: string; maxRounds?: number }) {
    const review: ReviewSession = {
      id: nanoid(10),
      projectId: input.projectId,
      taskId: input.taskId,
      title: input.title,
      webPatchId: input.webPatchId,
      executionJobId: input.executionJobId,
      webSummary: input.webSummary,
      codexSummary: input.codexSummary,
      status: "open",
      maxRounds: Math.max(1, Math.min(2, Number(input.maxRounds || 2))),
      roundsUsed: 0,
      events: [{ at: now(), type: "review_created", message: "Cross review session created." }],
      createdAt: now(),
      updatedAt: now()
    };
    this.stateStore.update((state) => {
      state.reviewSessions.push(review);
    });
    return review;
  }

  addCrossReviewRound(input: { reviewId: string; speaker: "chatgpt-web" | "codex" | "user"; blockingIssues: string[]; concreteImprovements: string[]; evidence: string[]; recommendedDecision: "use_webagent_result" | "use_codex_result" | "hybrid" | "needs_human" }) {
    return this.stateStore.update((state) => {
      const review = state.reviewSessions.find((item) => item.id === input.reviewId);
      if (!review) throw new Error("review not found");
      if (review.status !== "open") throw new Error(`review is not open: ${review.status}`);
      if (review.roundsUsed >= review.maxRounds) throw new Error("round limit reached; finalize the review");
      review.roundsUsed += 1;
      review.updatedAt = now();
      review.events.push({
        at: now(),
        type: "review_round",
        message: `${input.speaker}: ${input.recommendedDecision}`,
        data: {
          blockingIssues: input.blockingIssues,
          concreteImprovements: input.concreteImprovements,
          evidence: input.evidence,
          recommendedDecision: input.recommendedDecision
        }
      });
      return { review, remainingRounds: Math.max(0, review.maxRounds - review.roundsUsed), stopNow: review.roundsUsed >= review.maxRounds };
    });
  }

  finalizeCrossReview(input: { reviewId: string; decision: "use_webagent_result" | "use_codex_result" | "hybrid" | "needs_human"; rationale: string }) {
    return this.stateStore.update((state) => {
      const review = state.reviewSessions.find((item) => item.id === input.reviewId);
      if (!review) throw new Error("review not found");
      review.status = input.decision === "needs_human" ? "needs_human" : "accepted";
      review.decision = input.decision === "use_webagent_result" ? "web" : input.decision === "use_codex_result" ? "codex" : input.decision;
      review.rationale = input.rationale;
      review.updatedAt = now();
      review.events.push({ at: now(), type: "review_decision", message: `${input.decision}: ${input.rationale}` });
      return review;
    });
  }

  async createUiScreenshotJob(input: { projectId: string; taskId?: string; devServerUrl?: string; route?: string; notes?: string; runImmediately?: boolean }, requestId?: string) {
    const task = this.createTask({
      projectId: input.projectId,
      taskTitle: "UI Screenshot Review",
      taskGoal: [
        "Review the UI via screenshot or browser automation.",
        input.devServerUrl ? `Target URL: ${input.devServerUrl}` : "No dev server URL provided.",
        input.route ? `Route: ${input.route}` : "",
        input.notes ? `Notes: ${input.notes}` : ""
      ].filter(Boolean).join("\n"),
      executorMode: "webagent",
      executorPolicy: "fast",
      relatedConversationHint: "UI screenshot review",
      uiScreenshotRequest: {
        devServerUrl: input.devServerUrl,
        route: input.route,
        notes: input.notes
      },
      createContextPack: false
    }).task;
    return this.createExecutionJob({ taskId: task.id, executorMode: "webagent", runImmediately: input.runImmediately ?? true }, requestId);
  }

  getUiScreenshotResult(jobId: string) {
    return this.getExecutionJob(jobId);
  }

  listRoles() {
    if (!fs.existsSync(ROLE_DIR)) return [];
    return fs.readdirSync(ROLE_DIR).filter((name) => name.endsWith(".md")).sort().map((name) => ({
      id: name.replace(/\.md$/, ""),
      name,
      path: path.join(ROLE_DIR, name),
      preview: filePreview(path.join(ROLE_DIR, name), 1200)
    }));
  }

  listSkills(projectId?: string) {
    const project = projectId ? this.getProject(projectId) : this.stateStore.load().projects[0];
    return project ? this.skillLoader.list(project.path) : [];
  }

  getExecutorsInfo() {
    const runtime = this.runtimeStore.load();
    return {
      runtimeExecution: runtime.execution,
      defaultExecutorMode: "webagent",
      defaultExecutorPolicy: "save_codex_quota",
      modes: [
        { ...this.webAgentExecutor.descriptor, summary: this.webAgentExecutor.descriptor.description },
        { ...this.codexExecutor.descriptor, summary: this.codexExecutor.descriptor.description },
        { ...this.hybridExecutor.descriptor, summary: this.hybridExecutor.descriptor.description },
        { ...this.externalExecutor.descriptor, summary: this.externalExecutor.descriptor.description }
      ],
      policies: [
        { id: "save_codex_quota", summary: "Prefer WebAgent when the task is small enough." },
        { id: "best_result", summary: "Prefer Hybrid or Codex when accuracy matters most." },
        { id: "fast", summary: "Prefer the quickest safe executor." },
        { id: "manual", summary: "Let the user pick the executor explicitly." }
      ],
      externalExecutors: this.externalExecutor.list(),
      configPath: EXTERNAL_EXECUTOR_CONFIG_FILE
    };
  }

  getDiagnostics() {
    const state = this.stateStore.load();
    const errors = this.logStore.list({ limit: 20, level: "error" });
    return {
      runtime: this.runtimeStore.load(),
      settings: state.settings,
      counts: {
        projects: state.projects.length,
        tasks: state.tasks.length,
        executionJobs: state.executionJobs.length,
        patches: state.webPatches.length,
        shellCommands: state.shellCommands.length,
        repairs: state.repairProposals.length
      },
      recentErrors: errors
    };
  }

  getSupportBundle() {
    return {
      status: this.getBridgeStatus(),
      diagnostics: this.getDiagnostics(),
      setup: this.getSetupGuide(),
      executors: this.getExecutorsInfo(),
      mcpTools: this.getMcpToolCatalog()
    };
  }

  updateRuntimeExecution(execution: "dry-run" | "cli" | "app-server") {
    return this.runtimeStore.save({ execution });
  }

  updatePermissionMode(input: { permissionMode: BridgeState["settings"]["permissionMode"]; confirmFullAccess?: string }) {
    if (input.permissionMode === "full_access") {
      const confirm = (input.confirmFullAccess || "").trim().toLowerCase();
      if (confirm !== "i understand" && confirm !== "我已理解风险") {
        throw new Error("full_access requires confirmFullAccess exactly 'I understand' or '我已理解风险'");
      }
    }
    return this.stateStore.update((state) => {
      state.settings = normalizeSettings({ ...state.settings, permissionMode: input.permissionMode });
      return state.settings;
    });
  }

  getConfig() {
    const runtime = this.runtimeStore.load();
    const state = this.stateStore.load();
    return {
      execution: runtime.execution,
      settings: state.settings,
      localPairingCodePath: path.relative(process.cwd(), path.join("data", "runtime.json")),
      contextPackDir: path.relative(process.cwd(), CONTEXT_PACKS_DIR),
      screenshotDir: path.relative(process.cwd(), "data/screenshots")
    };
  }
}
