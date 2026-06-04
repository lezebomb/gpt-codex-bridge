import { z } from "zod";

export const executionModeSchema = z.enum(["dry-run", "cli", "app-server"]);
export const permissionModeSchema = z.enum(["read_only", "manual_review", "auto_review", "full_access"]);
export const approvalPolicySchema = z.enum(["never", "onRequest", "unlessTrusted"]);
export const sandboxModeSchema = z.enum(["readOnly", "workspaceWrite", "dangerFullAccess"]);
export const executorModeSchema = z.enum(["webagent", "codex", "hybrid", "external"]);
export const executorPolicySchema = z.enum(["save_codex_quota", "best_result", "fast", "manual"]);
export const contextPackBudgetSchema = z.enum(["small", "medium", "large"]);
export const taskStateSchema = z.enum([
  "draft",
  "created",
  "context_index_required",
  "context_ready",
  "planning",
  "patch_proposed",
  "awaiting_approval",
  "applied",
  "verifying",
  "needs_repair",
  "completed",
  "blocked",
  "failed",
  "cancelled"
]);
export const jobStatusSchema = z.enum([
  "draft",
  "ready",
  "queued",
  "needs_approval",
  "running",
  "completed",
  "failed",
  "cancelled",
  "rejected"
]);
export const taskStatusSchema = taskStateSchema;
export const taskBranchStatusSchema = z.enum(["active", "paused", "archived", "completed", "blocked", "failed"]);

export type JsonObject = Record<string, unknown>;
export type ExecutionMode = z.infer<typeof executionModeSchema>;
export type PermissionMode = z.infer<typeof permissionModeSchema>;
export type ApprovalPolicy = z.infer<typeof approvalPolicySchema>;
export type SandboxMode = z.infer<typeof sandboxModeSchema>;
export type ExecutorMode = z.infer<typeof executorModeSchema>;
export type ExecutorPolicy = z.infer<typeof executorPolicySchema>;
export type ContextPackBudget = z.infer<typeof contextPackBudgetSchema>;
export type TaskState = z.infer<typeof taskStateSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskBranchStatus = z.infer<typeof taskBranchStatusSchema>;

export type RuntimeSettings = {
  token: string;
  execution: ExecutionMode;
  updatedAt: string;
};

export type BridgeSettings = {
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

export type LogEntry = {
  id: string;
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  source: string;
  action: string;
  message: string;
  requestId?: string;
  projectId?: string;
  taskId?: string;
  details?: unknown;
};

export type Project = {
  id: string;
  name: string;
  path: string;
  allowShell: boolean;
  createdAt: string;
  updatedAt: string;
};

export type JobEvent = {
  at: string;
  type: string;
  message: string;
  data?: unknown;
};

export type TaskConflict = {
  taskId: string;
  taskTitle: string;
  filePath: string;
};

export type TaskArtifact = {
  id: string;
  type: "context_pack" | "retrieved_context" | "patch" | "execution_job" | "shell_command" | "repair" | "screenshot" | "note";
  label: string;
  filePaths?: string[];
  meta?: Record<string, unknown>;
};

export type ContextPackSummary = {
  budget: ContextPackBudget;
  files: number;
  snippetFiles: number;
  truncatedFiles: number;
  treeEntries: number;
  includesGitStatus: boolean;
  includesDiff: boolean;
  ruleFiles: number;
  skills: number;
};

export type ContextPackRecord = {
  id: string;
  projectId: string;
  taskId?: string;
  goal?: string;
  filePath: string;
  summary: ContextPackSummary;
  createdAt: string;
  updatedAt: string;
};

export type UiScreenshotRequest = {
  devServerUrl?: string;
  route?: string;
  notes?: string;
};

export type TaskRecord = {
  id: string;
  projectId: string;
  taskTitle: string;
  taskGoal: string;
  status: TaskStatus;
  executorMode: ExecutorMode;
  executorPolicy: ExecutorPolicy;
  executorLocked: boolean;
  executorDecisionReason: string;
  executorSwitchReason?: string;
  taskBranchIds: string[];
  activeTaskBranchId?: string;
  contextPackIds: string[];
  retrievedContextIds: string[];
  patchIds: string[];
  executionJobIds: string[];
  shellCommandIds: string[];
  approvals: string[];
  logs: string[];
  decisions: Array<{ at: string; source: "router" | "webagent" | "user" | "system"; summary: string }>;
  artifacts: TaskArtifact[];
  relatedConversationHint?: string;
  chatTitleHint?: string;
  uiScreenshotRequest?: UiScreenshotRequest;
  claimedFiles: string[];
  conflicts: TaskConflict[];
  recommendedNextAction?: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskBranchRecord = {
  id: string;
  projectId: string;
  taskId: string;
  branchName: string;
  branchGoal: string;
  chatTitleHint?: string;
  status: TaskBranchStatus;
  executorMode: ExecutorMode;
  executorLocked: boolean;
  executorDecisionReason: string;
  executorSwitchReason?: string;
  baseGitHead?: string;
  gitBranchName?: string;
  touchedFiles: string[];
  patchIds: string[];
  contextPackIds: string[];
  retrievedContextIds: string[];
  approvalIds: string[];
  logRequestIds: string[];
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
};

export type RetrievedContextSnippet = {
  filePath: string;
  text: string;
  reason: string;
  score: number;
};

export type RetrievedContextFileDetail = {
  path: string;
  reason: string;
  summary: string;
  snippets: string[];
  exportedSymbols: string[];
  suggestedNextRead: string;
};

export type RetrievedContextRecord = {
  id: string;
  projectId: string;
  taskId?: string;
  taskBranchId?: string;
  query: string;
  purpose?: string;
  conciseSummary: string;
  relevantFiles: string[];
  relevantFileDetails: RetrievedContextFileDetail[];
  snippets: RetrievedContextSnippet[];
  rulesSummary: string[];
  matchedSkills: string[];
  suggestedNextReads: string[];
  estimatedTokenBudget: number;
  retrievalWarnings: string[];
  provider: "fts" | "fallback" | "hybrid";
  createdAt: string;
  updatedAt: string;
};

export type ProjectIndexRecord = {
  projectId: string;
  status: "missing" | "ready" | "stale" | "indexing" | "failed";
  indexedFiles: number;
  lastIndexedAt?: string;
  staleFiles: string[];
  indexSize: number;
  primaryProvider?: string;
  enabledProviders: string[];
  version?: string;
  manifestPath?: string;
  sqlitePath?: string;
  summariesPath?: string;
  createdAt: string;
  updatedAt: string;
};

export type WebPatchChange = {
  filePath: string;
  content: string;
  mode: "create" | "overwrite";
};

export type PatchFileSnapshot = {
  filePath: string;
  existed: boolean;
  contentHash: string;
};

export type PatchConflictStatus = {
  conflictDetected: boolean;
  stalePatch: boolean;
  overlappingFiles: string[];
  conflictingBranches: Array<{
    taskBranchId: string;
    taskId: string;
    branchName: string;
    overlappingFiles: string[];
  }>;
  changedFiles: string[];
  baseGitHead: string | null;
  currentGitHead: string | null;
  suggestedAction: Array<"refresh_context" | "rebase_patch" | "inspect_conflict" | "archive_conflicting_branch" | "continue_with_manual_approval">;
  blockingReasons: string[];
  requiresApproval: boolean;
};

export type WebPatch = {
  id: string;
  projectId: string;
  taskId?: string;
  taskBranchId?: string;
  title: string;
  rationale: string;
  status: "draft" | "needs_approval" | "applied" | "rejected" | "reverted";
  changes: WebPatchChange[];
  touchedFiles: string[];
  baseGitHead?: string;
  fileSnapshots: PatchFileSnapshot[];
  conflicts: TaskConflict[];
  lastConflictStatus?: PatchConflictStatus;
  createdBy: "chatgpt-web" | "user" | "bridge";
  appliedAt?: string;
  rejectedAt?: string;
  events: JobEvent[];
  createdAt: string;
  updatedAt: string;
};

export type ExecutorPacket = {
  projectPath: string;
  taskGoal: string;
  relevantContextSummary: string;
  constraints: string[];
  expectedOutput: string[];
  safetyNote: string;
  referencedRoles: string[];
  referencedSkills: string[];
};

export type ExecutionJob = {
  id: string;
  projectId: string;
  taskId?: string;
  taskBranchId?: string;
  title: string;
  executorMode: ExecutorMode;
  executorPolicy: ExecutorPolicy;
  status: JobStatus;
  safetyLevel: number;
  requiresApproval: boolean;
  approvedAt?: string;
  rejectedAt?: string;
  commandPreview?: string;
  prompt?: string;
  packet?: ExecutorPacket;
  result?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  error?: string;
  externalExecutorId?: string;
  artifacts: TaskArtifact[];
  events: JobEvent[];
  createdAt: string;
  updatedAt: string;
};

export type ShellCommandRecord = {
  id: string;
  projectId: string;
  taskId?: string;
  taskBranchId?: string;
  command: string;
  cwd: string;
  timeoutMs: number;
  shell: "powershell" | "cmd" | "bash";
  classification: "read_only" | "project_write" | "dangerous";
  status: JobStatus;
  requiresApproval: boolean;
  approvedAt?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  error?: string;
  events: JobEvent[];
  createdAt: string;
  updatedAt: string;
};

export type ReviewSession = {
  id: string;
  projectId: string;
  taskId?: string;
  title: string;
  webPatchId?: string;
  executionJobId?: string;
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

export type ApprovalRequest = {
  id: string;
  executionJobId?: string;
  method: string;
  params: unknown;
  status: "pending" | "approved" | "declined" | "expired";
  decision?: "accept" | "decline" | "cancel";
  expiresAt: string;
  events: JobEvent[];
  createdAt: string;
  updatedAt: string;
};

export type RepairProposal = {
  id: string;
  projectId?: string;
  taskId?: string;
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
  createdExecutionJobId?: string;
  createdTaskId?: string;
  events: JobEvent[];
  createdAt: string;
  updatedAt: string;
};

export type McpPluginStatus = "built-in" | "available" | "disabled" | "not_implemented";
export type McpPlugin = {
  id: string;
  name: string;
  status: McpPluginStatus;
  risk: "low" | "medium" | "high";
  canReadFiles: boolean;
  canWriteFiles: boolean;
  canAccessNetwork: boolean;
  needsToken: boolean;
  description: string;
  notes?: string;
};

export type McpPluginRuntimeConfig = {
  id: string;
  enabled: boolean;
  config: Record<string, unknown>;
  updatedAt: string;
};

export type ExternalExecutorConfig = {
  id: string;
  name: string;
  command: string;
  args: string[];
  cwdMode: "project" | "bridge" | "custom";
  cwd?: string;
  env: Record<string, string>;
  enabled: boolean;
  riskLevel: "low" | "medium" | "high";
};

export type BridgeState = {
  projects: Project[];
  tasks: TaskRecord[];
  taskBranches: TaskBranchRecord[];
  executionJobs: ExecutionJob[];
  webPatches: WebPatch[];
  contextPacks: ContextPackRecord[];
  retrievedContexts: RetrievedContextRecord[];
  projectIndexes: ProjectIndexRecord[];
  reviewSessions: ReviewSession[];
  approvalRequests: ApprovalRequest[];
  repairProposals: RepairProposal[];
  shellCommands: ShellCommandRecord[];
  mcpPluginConfigs: McpPluginRuntimeConfig[];
  settings: BridgeSettings;
};
