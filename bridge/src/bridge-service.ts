import fs from "node:fs";
import path from "node:path";

import { nanoid } from "nanoid";

import { CONTEXT_PACKS_DIR, EXTERNAL_EXECUTOR_CONFIG_FILE, HOST, MCP_PLUGINS, PORT, ROLE_DIR, VERSION } from "./config.js";
import { compactForLog, ensureDir, filePreview, now } from "./lib/common.js";
import { assertSafeRelativePath, findReadmePreview, inferTechStack, listBrowsableDirectories, listFilesystemRoots, readProjectFile, safeProjectPath } from "./project-files.js";
import { ApprovalRequest, BridgeState, ContextPackRecord, ExecutionJob, ExecutorMode, ExecutorPacket, ExecutorPolicy, ExternalExecutorConfig, McpPluginRuntimeConfig, Project, RepairProposal, ReviewSession, TaskRecord, UiScreenshotRequest, WebPatch } from "./types.js";
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
import { ShellRunner } from "./runtime/webagent/shell-runner.js";
import { TaskStore } from "./runtime/webagent/task-store.js";
import { UiScreenshotRunner } from "./runtime/webagent/ui-screenshot-runner.js";
import { RuntimeStore } from "./runtime/runtime-store.js";
import { StateStore } from "./runtime/state-store.js";
import { LogStore } from "./runtime/log-store.js";

export class BridgeService {
  readonly runtimeStore = new RuntimeStore();
  readonly stateStore = new StateStore();
  readonly logStore = new LogStore();
  readonly diffManager = new DiffManager();
  readonly instructionLoader = new InstructionLoader();
  readonly skillLoader = new SkillLoader();
  readonly approvalEngine = new ApprovalEngine(() => this.stateStore.readSettings());
  readonly taskStore = new TaskStore(this.stateStore);
  readonly contextCollector = new ContextCollector(this.diffManager, this.instructionLoader, this.skillLoader);
  readonly patchEngine = new PatchEngine(this.stateStore, this.taskStore, this.approvalEngine, this.diffManager, this.logStore);
  readonly shellRunner = new ShellRunner(this.stateStore, this.approvalEngine, this.logStore);
  readonly uiScreenshotRunner = new UiScreenshotRunner(this.logStore);
  readonly router = new ExecutorRouter();
  readonly webAgentExecutor = new WebAgentExecutor();
  readonly hybridExecutor = new HybridExecutor();
  readonly externalExecutor = new ExternalExecutor();
  readonly codexExecutor = new CodexExecutor(this.runtimeStore, this.stateStore, this.approvalEngine, this.logStore);

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
      authModeRecommendation: "Access token / API key",
      pairingCodeLabel: "Local pairing code",
      windowsPowerShellQuickStart: [
        "cd .\\bridge",
        "npm.cmd install --no-audit --no-fund",
        "npm.cmd run dev",
        "Open http://localhost:8787/dashboard/ and copy the Local pairing code from Setup."
      ],
      chatgptCustomMcpSteps: [
        "Expose http://localhost:8787 with Cloudflare Tunnel or another HTTPS tunnel.",
        "In ChatGPT Custom MCP, set the server URL to https://your-domain/mcp.",
        "Use the local pairing code as the access token / API key.",
        "Start every new conversation by calling get_bridge_status, then bind to projectId/taskId."
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
    return [
      ["get_bridge_status", "Read bridge version, modes, default executor, project count, task count, and recent error summary."],
      ["get_setup_guide", "Read the local setup guide for Windows PowerShell and ChatGPT Custom MCP."],
      ["browse_folders", "Browse safe local directories for file-manager style project selection."],
      ["select_project", "Register a folder as a project allowlist root and return projectId."],
      ["list_projects", "List registered local projects."],
      ["inspect_project", "Inspect tree, README, package.json, rules, git status, and tech stack."],
      ["read_file", "Read one file inside a registered project root."],
      ["create_context_pack", "Create a bounded context pack for one task goal."],
      ["create_task", "Create a task with executor routing and conflict detection."],
      ["list_tasks", "List tasks."],
      ["get_task", "Read one task and its related state."],
      ["continue_task", "Continue a task in a new conversation."],
      ["propose_web_patch", "Create a bounded patch draft without writing files immediately."],
      ["get_patch_diff", "Read a patch diff."],
      ["request_apply_patch", "Apply a patch when permission mode allows it, or defer to dashboard approval."],
      ["request_revert_patch", "Revert a patch when permission mode allows it, or defer to dashboard approval."],
      ["run_shell_command", "Create a shell command request with timeout, cwd, and approval handling."],
      ["create_execution_job", "Create an execution job for WebAgent, Codex, Hybrid, or External."],
      ["get_execution_job", "Read an execution job result."],
      ["get_latest_logs", "Read recent logs."],
      ["analyze_error_log", "Analyze the latest or matching error log."],
      ["create_repair_proposal", "Create a repair proposal that requires approval."],
      ["create_ui_screenshot_job", "Create a screenshot review job."],
      ["get_ui_screenshot_result", "Read a screenshot review result."],
      ["create_cross_review", "Open a bounded cross review."],
      ["add_cross_review_round", "Add one bounded cross review round."],
      ["finalize_cross_review", "Finalize a cross review."],
      ["create_webagent_task", "Shortcut: create a WebAgent task and its execution job."],
      ["create_codex_job", "Legacy alias for a Codex execution job."],
      ["get_codex_job", "Legacy alias for reading a Codex execution job."]
    ].map(([name, description]) => ({ name, description }));
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

  async createContextPack(input: { projectId: string; taskId?: string; goal?: string; paths?: string[]; includeTree?: boolean; includeGitStatus?: boolean; includeDiff?: boolean }) {
    const project = this.getProject(input.projectId);
    const { record, markdown } = await this.contextCollector.createContextPack(project, input);
    this.stateStore.update((state) => {
      state.contextPacks.push(record);
    });
    if (input.taskId) {
      this.taskStore.linkArtifact(input.taskId, { id: record.id, type: "context_pack", label: "Context pack" });
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
      status: "active",
      executorMode: routing.mode,
      executorPolicy: routing.policy,
      contextPackIds: [],
      patchIds: [],
      executionJobIds: [],
      shellCommandIds: [],
      approvals: [],
      logs: [],
      claimedFiles: targetFiles,
      relatedConversationHint: input.relatedConversationHint,
      uiScreenshotRequest: input.uiScreenshotRequest,
      summary: routing.reasons.join(" "),
      artifacts: [],
      conflicts
    });
    this.logStore.write({
      level: conflicts.length ? "warn" : "info",
      source: "mcp",
      action: "create_task",
      message: conflicts.length ? "Task created with file conflict warnings." : "Task created.",
      projectId: project.id,
      taskId: task.id,
      details: { taskId: task.id, executorMode: task.executorMode, executorPolicy: task.executorPolicy, conflicts }
    });
    return { task, routing, conflicts, createContextPackSuggested: Boolean(input.contextPaths?.length || targetFiles.length || input.createContextPack) };
  }

  listTasks(projectId?: string) {
    return this.taskStore.list(projectId);
  }

  getTask(taskId: string) {
    const task = this.taskStore.get(taskId);
    const state = this.stateStore.load();
    return {
      task,
      contextPacks: state.contextPacks.filter((pack) => task.contextPackIds.includes(pack.id)),
      patches: state.webPatches.filter((patch) => task.patchIds.includes(patch.id)),
      executionJobs: state.executionJobs.filter((job) => task.executionJobIds.includes(job.id)),
      shellCommands: state.shellCommands.filter((cmd) => task.shellCommandIds.includes(cmd.id))
    };
  }

  async continueTask(input: { taskId: string; note?: string; relatedConversationHint?: string; createContextPack?: boolean }) {
    const task = this.taskStore.update(input.taskId, (current) => {
      current.status = "active";
      if (input.relatedConversationHint) current.relatedConversationHint = input.relatedConversationHint;
      if (input.note) current.summary = input.note;
    });
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
    }
    return { task, contextPack };
  }

  proposeWebPatch(input: { projectId: string; taskId?: string; title: string; rationale?: string; changes: WebPatch["changes"] }, requestId?: string) {
    const project = this.getProject(input.projectId);
    return this.patchEngine.create(project, input, requestId);
  }

  getPatchDiff(patchId: string) {
    const patch = this.patchEngine.get(patchId);
    const project = this.getProject(patch.projectId);
    return this.patchEngine.diff(project, patchId);
  }

  requestApplyPatch(patchId: string, requestId?: string) {
    const patch = this.patchEngine.get(patchId);
    const project = this.getProject(patch.projectId);
    return this.patchEngine.requestApply(project, patchId, requestId);
  }

  requestRevertPatch(patchId: string, requestId?: string) {
    const patch = this.patchEngine.get(patchId);
    const project = this.getProject(patch.projectId);
    return this.patchEngine.requestRevert(project, patchId, requestId);
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

  async createExecutionJob(input: { taskId: string; executorMode?: ExecutorMode; executorPolicy?: ExecutorPolicy; externalExecutorId?: string; runImmediately?: boolean }, requestId?: string) {
    const task = this.taskStore.get(input.taskId);
    const project = this.getProject(task.projectId);
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
    const job: ExecutionJob = {
      id: nanoid(10),
      projectId: project.id,
      taskId: task.id,
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
    this.logStore.write({
      level: "info",
      source: "mcp",
      action: "create_execution_job",
      message: "Execution job created.",
      requestId,
      projectId: project.id,
      taskId: task.id,
      details: { jobId: job.id, executorMode, executorPolicy, requiresApproval }
    });
    if (input.runImmediately && !requiresApproval) {
      return this.runExecutionJob(job.id, requestId);
    }
    return { job };
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
      status: "active",
      executorMode: job.executorMode,
      executorPolicy: job.executorPolicy,
      contextPackIds: [],
      patchIds: [],
      executionJobIds: [job.id],
      shellCommandIds: [],
      approvals: [],
      logs: [],
      claimedFiles: [],
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
          taskRecord.status = target.status === "completed" ? "completed" : taskRecord.status === "cancelled" ? "cancelled" : "active";
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
        details: { jobId: target.id, exitCode: target.exitCode }
      });
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

  async runShellCommand(input: { projectId: string; taskId?: string; command: string; cwd?: string; timeoutMs?: number; shell?: "powershell" | "cmd" | "bash"; runImmediately?: boolean }, requestId?: string) {
    const project = this.getProject(input.projectId);
    const command = this.shellRunner.create(project, input, requestId);
    if (input.taskId) {
      this.taskStore.linkArtifact(input.taskId, { id: command.id, type: "shell_command", label: command.command });
    }
    if (input.runImmediately && !command.requiresApproval) {
      const result = await this.shellRunner.run(command.id, requestId);
      return { command: result };
    }
    return { command };
  }

  approveShellCommand(commandId: string) {
    return this.shellRunner.approve(commandId);
  }

  async getLatestLogs(input: { level?: "debug" | "info" | "warn" | "error"; requestId?: string; limit?: number; projectId?: string; taskId?: string }) {
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
      executionJobs: state.executionJobs.filter((job) => job.status === "needs_approval"),
      shellCommands: state.shellCommands.filter((command) => command.status === "needs_approval"),
      repairs: state.repairProposals.filter((repair) => repair.status === "needs_approval"),
      patches: state.webPatches.filter((patch) => patch.status === "needs_approval")
    };
  }

  listPatches() {
    return this.patchEngine.list();
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
        { id: "webagent", summary: "Default. ChatGPT Web drives local MCP tools without consuming Codex quota." },
        { id: "codex", summary: "Full native Codex executor for multi-file implementation, testing, and repair work." },
        { id: "hybrid", summary: "WebAgent plans or drafts; Codex validates, tests, and resolves integration issues." },
        { id: "external", summary: "Stub preview for third-party CLI coding agents. Configuration lives in bridge/config/external-executors.json." }
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
