import { STATE_FILE } from "../config.js";
import { readJsonFile, writeJsonFile } from "../lib/common.js";
import { ApprovalRequest, BridgeState, BridgeSettings, ContextPackRecord, ExecutionJob, McpPluginRuntimeConfig, RepairProposal, ReviewSession, ShellCommandRecord, TaskRecord, WebPatch } from "../types.js";
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

export class StateStore {
  private defaultState(): BridgeState {
    return {
      projects: [],
      tasks: [],
      executionJobs: [],
      webPatches: [],
      contextPacks: [],
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
      tasks: Array.isArray((parsed as any).tasks) ? ((parsed as any).tasks as TaskRecord[]) : [],
      executionJobs: executionJobs.length ? executionJobs : legacyJobs,
      webPatches: Array.isArray((parsed as any).webPatches) ? ((parsed as any).webPatches as WebPatch[]) : [],
      contextPacks: Array.isArray((parsed as any).contextPacks) ? ((parsed as any).contextPacks as ContextPackRecord[]) : [],
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
