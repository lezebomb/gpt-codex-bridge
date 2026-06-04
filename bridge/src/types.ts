import { z } from "zod";

export const executionModeSchema = z.enum(["dry-run", "cli", "app-server"]);
export const permissionModeSchema = z.enum(["read_only", "manual_review", "auto_review", "full_access"]);
export const approvalPolicySchema = z.enum(["never", "onRequest", "unlessTrusted"]);
export const sandboxModeSchema = z.enum(["readOnly", "workspaceWrite", "dangerFullAccess"]);
export const executorModeSchema = z.enum(["webagent", "codex", "hybrid", "external"]);
export const executorPolicySchema = z.enum(["save_codex_quota", "best_result", "fast", "manual"]);
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
export const taskStatusSchema = z.enum(["draft", "active", "completed", "blocked", "failed", "cancelled"]);

export type JsonObject = Record<string, unknown>;
export type ExecutionMode = z.infer<typeof executionModeSchema>;
export type PermissionMode = z.infer<typeof permissionModeSchema>;
export type ApprovalPolicy = z.infer<typeof approvalPolicySchema>;
export type SandboxMode = z.infer<typeof sandboxModeSchema>;
export type ExecutorMode = z.infer<typeof executorModeSchema>;
export type ExecutorPolicy = z.infer<typeof executorPolicySchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;

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
  type: "context_pack" | "patch" | "execution_job" | "shell_command" | "repair" | "screenshot" | "note";
  label: string;
  filePaths?: string[];
  meta?: Record<string, unknown>;
};

export type ContextPackSummary = {
  files: number;
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
  contextPackIds: string[];
  patchIds: string[];
  executionJobIds: string[];
  shellCommandIds: string[];
  approvals: string[];
  logs: string[];
  artifacts: TaskArtifact[];
  relatedConversationHint?: string;
  uiScreenshotRequest?: UiScreenshotRequest;
  claimedFiles: string[];
  conflicts: TaskConflict[];
  summary?: string;
  createdAt: string;
  updatedAt: string;
};

export type WebPatchChange = {
  filePath: string;
  content: string;
  mode: "create" | "overwrite";
};

export type WebPatch = {
  id: string;
  projectId: string;
  taskId?: string;
  title: string;
  rationale: string;
  status: "draft" | "needs_approval" | "applied" | "rejected" | "reverted";
  changes: WebPatchChange[];
  conflicts: TaskConflict[];
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
  executionJobs: ExecutionJob[];
  webPatches: WebPatch[];
  contextPacks: ContextPackRecord[];
  reviewSessions: ReviewSession[];
  approvalRequests: ApprovalRequest[];
  repairProposals: RepairProposal[];
  shellCommands: ShellCommandRecord[];
  mcpPluginConfigs: McpPluginRuntimeConfig[];
  settings: BridgeSettings;
};
