import { STATE_FILE } from "../config.js";
import { now } from "../lib/common.js";
import { readJsonFile, writeJsonFile } from "../lib/common.js";
import { ApprovalRequest, BridgeState, BridgeSettings, ContextPackRecord, ExecutionJob, McpPluginRuntimeConfig, ProjectIndexRecord, RepairProposal, RetrievedContextRecord, ReviewSession, ShellCommandRecord, TaskBranchRecord, TaskRecord, WebPatch } from "../types.js";
import { defaultSettings, normalizeSettings } from "./webagent/approval-engine.js";

function migrateExecutionJobs(input: unknown): ExecutionJob[] {
  if (Array.isArray(input)) {
    return input as ExecutionJob[];
  }
  return [];
}

function migrateLegacyJobs(input: unknown): ExecutionJob[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.map((job: any) => ({
    id: String(job.id),
    projectId: String(job.projectId),
    taskId: typeof job.taskId === "string" ? job.taskId : undefined,
    title: String(job.title || "Legacy Codex job"),
    executorMode: "codex",
    executorPolicy: "manual",
    status: job.status || "completed",
    safetyLevel: Number(job.safetyLevel || 1),
    requiresApproval: Boolean(job.requiresApproval),
    approvedAt: typeof job.approvedAt === "string" ? job.approvedAt : undefined,
    rejectedAt: typeof job.rejectedAt === "string" ? job.rejectedAt : undefined,
    prompt: typeof job.codexPrompt === "string" ? job.codexPrompt : undefined,
    result: typeof job.result === "string" ? job.result : undefined,
    stdout: typeof job.stdout === "string" ? job.stdout : undefined,
    stderr: typeof job.stderr === "string" ? job.stderr : undefined,
    exitCode: typeof job.exitCode === "number" ? job.exitCode : null,
    error: typeof job.error === "string" ? job.error : undefined,
    artifacts: [],
    events: Array.isArray(job.events) ? job.events : [],
    createdAt: typeof job.createdAt === "string" ? job.createdAt : new Date().toISOString(),
    updatedAt: typeof job.updatedAt === "string" ? job.updatedAt : new Date().toISOString()
  }));
}

function migrateTask(input: any): TaskRecord {
  return {
    id: String(input.id),
    projectId: String(input.projectId),
    taskTitle: String(input.taskTitle || input.taskGoal || "Task"),
    taskGoal: String(input.taskGoal || input.taskTitle || "Task"),
    status: input.status || "created",
    executorMode: input.executorMode || "webagent",
    executorPolicy: input.executorPolicy || "save_codex_quota",
    executorLocked: input.executorLocked !== false,
    executorDecisionReason: String(input.executorDecisionReason || input.summary || "Migrated task"),
    executorSwitchReason: typeof input.executorSwitchReason === "string" ? input.executorSwitchReason : undefined,
    taskBranchIds: Array.isArray(input.taskBranchIds) ? input.taskBranchIds : [],
    activeTaskBranchId: typeof input.activeTaskBranchId === "string" ? input.activeTaskBranchId : undefined,
    contextPackIds: Array.isArray(input.contextPackIds) ? input.contextPackIds : [],
    retrievedContextIds: Array.isArray(input.retrievedContextIds) ? input.retrievedContextIds : [],
    patchIds: Array.isArray(input.patchIds) ? input.patchIds : [],
    executionJobIds: Array.isArray(input.executionJobIds) ? input.executionJobIds : [],
    shellCommandIds: Array.isArray(input.shellCommandIds) ? input.shellCommandIds : [],
    approvals: Array.isArray(input.approvals) ? input.approvals : [],
    logs: Array.isArray(input.logs) ? input.logs : [],
    decisions: Array.isArray(input.decisions) ? input.decisions : [],
    artifacts: Array.isArray(input.artifacts) ? input.artifacts : [],
    relatedConversationHint: typeof input.relatedConversationHint === "string" ? input.relatedConversationHint : undefined,
    chatTitleHint: typeof input.chatTitleHint === "string" ? input.chatTitleHint : undefined,
    uiScreenshotRequest: input.uiScreenshotRequest,
    claimedFiles: Array.isArray(input.claimedFiles) ? input.claimedFiles : [],
    conflicts: Array.isArray(input.conflicts) ? input.conflicts : [],
    recommendedNextAction: typeof input.recommendedNextAction === "string" ? input.recommendedNextAction : undefined,
    summary: typeof input.summary === "string" ? input.summary : undefined,
    createdAt: typeof input.createdAt === "string" ? input.createdAt : now(),
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : now()
  };
}

function migrateTaskBranch(input: any): TaskBranchRecord {
  return {
    id: String(input.id),
    projectId: String(input.projectId),
    taskId: String(input.taskId),
    branchName: String(input.branchName || "main"),
    branchGoal: String(input.branchGoal || "Task branch"),
    chatTitleHint: typeof input.chatTitleHint === "string" ? input.chatTitleHint : undefined,
    status: input.status || "active",
    executorMode: input.executorMode || "webagent",
    executorLocked: input.executorLocked !== false,
    executorDecisionReason: String(input.executorDecisionReason || "Migrated branch"),
    executorSwitchReason: typeof input.executorSwitchReason === "string" ? input.executorSwitchReason : undefined,
    baseGitHead: typeof input.baseGitHead === "string" ? input.baseGitHead : undefined,
    gitBranchName: typeof input.gitBranchName === "string" ? input.gitBranchName : undefined,
    touchedFiles: Array.isArray(input.touchedFiles) ? input.touchedFiles : [],
    patchIds: Array.isArray(input.patchIds) ? input.patchIds : [],
    contextPackIds: Array.isArray(input.contextPackIds) ? input.contextPackIds : [],
    retrievedContextIds: Array.isArray(input.retrievedContextIds) ? input.retrievedContextIds : [],
    approvalIds: Array.isArray(input.approvalIds) ? input.approvalIds : [],
    logRequestIds: Array.isArray(input.logRequestIds) ? input.logRequestIds : [],
    lastActiveAt: typeof input.lastActiveAt === "string" ? input.lastActiveAt : now(),
    createdAt: typeof input.createdAt === "string" ? input.createdAt : now(),
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : now()
  };
}

export class StateStore {
  private defaultState(): BridgeState {
    return {
      projects: [],
      tasks: [],
      taskBranches: [],
      executionJobs: [],
      webPatches: [],
      contextPacks: [],
      retrievedContexts: [],
      projectIndexes: [],
      reviewSessions: [],
      approvalRequests: [],
      repairProposals: [],
      shellCommands: [],
      mcpPluginConfigs: [],
      settings: defaultSettings()
    };
  }

  load(): BridgeState {
    const parsed = readJsonFile(STATE_FILE, this.defaultState() as BridgeState & { jobs?: unknown[] });
    const executionJobs = migrateExecutionJobs((parsed as any).executionJobs);
    const legacyJobs = executionJobs.length ? [] : migrateLegacyJobs((parsed as any).jobs);
    return {
      projects: Array.isArray((parsed as any).projects) ? (parsed as any).projects : [],
      tasks: Array.isArray((parsed as any).tasks) ? (parsed as any).tasks.map((item: any) => migrateTask(item)) : [],
      taskBranches: Array.isArray((parsed as any).taskBranches) ? (parsed as any).taskBranches.map((item: any) => migrateTaskBranch(item)) : [],
      executionJobs: executionJobs.length ? executionJobs : legacyJobs,
      webPatches: Array.isArray((parsed as any).webPatches) ? ((parsed as any).webPatches as WebPatch[]) : [],
      contextPacks: Array.isArray((parsed as any).contextPacks) ? ((parsed as any).contextPacks as ContextPackRecord[]) : [],
      retrievedContexts: Array.isArray((parsed as any).retrievedContexts) ? ((parsed as any).retrievedContexts as RetrievedContextRecord[]) : [],
      projectIndexes: Array.isArray((parsed as any).projectIndexes) ? ((parsed as any).projectIndexes as ProjectIndexRecord[]) : [],
      reviewSessions: Array.isArray((parsed as any).reviewSessions) ? ((parsed as any).reviewSessions as ReviewSession[]) : [],
      approvalRequests: Array.isArray((parsed as any).approvalRequests) ? ((parsed as any).approvalRequests as ApprovalRequest[]) : [],
      repairProposals: Array.isArray((parsed as any).repairProposals) ? ((parsed as any).repairProposals as RepairProposal[]) : [],
      shellCommands: Array.isArray((parsed as any).shellCommands) ? ((parsed as any).shellCommands as ShellCommandRecord[]) : [],
      mcpPluginConfigs: Array.isArray((parsed as any).mcpPluginConfigs) ? ((parsed as any).mcpPluginConfigs as McpPluginRuntimeConfig[]) : [],
      settings: normalizeSettings((parsed as any).settings)
    };
  }

  save(state: BridgeState): void {
    writeJsonFile(STATE_FILE, state);
  }

  update<T>(mutator: (state: BridgeState) => T): T {
    const state = this.load();
    const result = mutator(state);
    this.save(state);
    return result;
  }

  readSettings(): BridgeSettings {
    return this.load().settings;
  }
}
