import { ApprovalPolicy, BridgeSettings, PermissionMode, ShellCommandRecord, WebPatchChange, approvalPolicySchema, permissionModeSchema, sandboxModeSchema } from "../../types.js";

export function settingsForMode(mode: PermissionMode): BridgeSettings {
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

export function defaultSettings(): BridgeSettings {
  const envMode = permissionModeSchema.catch("auto_review").parse(process.env.BRIDGE_PERMISSION_MODE || process.env.ACCESS_MODE || "auto_review");
  const preset = settingsForMode(envMode);
  return {
    ...preset,
    requireApprovalForAllRuns: process.env.REQUIRE_APPROVAL_FOR_ALL_RUNS === undefined ? preset.requireApprovalForAllRuns : process.env.REQUIRE_APPROVAL_FOR_ALL_RUNS !== "false",
    codexApprovalPolicy: approvalPolicySchema.catch(preset.codexApprovalPolicy).parse(process.env.CODEX_APP_SERVER_APPROVAL_POLICY || preset.codexApprovalPolicy),
    codexSandboxMode: sandboxModeSchema.catch(preset.codexSandboxMode).parse(process.env.CODEX_APP_SERVER_SANDBOX || preset.codexSandboxMode),
    appServerApprovalResponse: ["accept", "decline", "prompt"].includes(String(process.env.CODEX_APP_SERVER_APPROVAL_RESPONSE))
      ? (process.env.CODEX_APP_SERVER_APPROVAL_RESPONSE as BridgeSettings["appServerApprovalResponse"])
      : preset.appServerApprovalResponse,
    networkAccess: process.env.CODEX_APP_SERVER_NETWORK === undefined ? preset.networkAccess : process.env.CODEX_APP_SERVER_NETWORK === "true"
  };
}

export function normalizeSettings(input: unknown): BridgeSettings {
  const fallback = defaultSettings();
  if (!input || typeof input !== "object") {
    return fallback;
  }
  const value = input as Partial<BridgeSettings>;
  const mode = permissionModeSchema.catch(fallback.permissionMode).parse(value.permissionMode || fallback.permissionMode);
  const preset = settingsForMode(mode);
  return {
    ...preset,
    ...value,
    permissionMode: mode,
    codexApprovalPolicy: approvalPolicySchema.catch(preset.codexApprovalPolicy).parse(value.codexApprovalPolicy || preset.codexApprovalPolicy),
    codexSandboxMode: sandboxModeSchema.catch(preset.codexSandboxMode).parse(value.codexSandboxMode || preset.codexSandboxMode),
    appServerApprovalResponse: ["accept", "decline", "prompt"].includes(String(value.appServerApprovalResponse))
      ? (value.appServerApprovalResponse as BridgeSettings["appServerApprovalResponse"])
      : preset.appServerApprovalResponse,
    maxReviewRoundsDefault: Math.max(1, Math.min(2, Number(value.maxReviewRoundsDefault || preset.maxReviewRoundsDefault)))
  };
}

export class ApprovalEngine {
  constructor(private readonly settings: () => BridgeSettings) {}

  currentSettings(): BridgeSettings {
    return this.settings();
  }

  requiresApprovalForExecution(safetyLevel: number): boolean {
    const settings = this.settings();
    if (settings.permissionMode === "full_access") {
      return false;
    }
    if (settings.permissionMode === "read_only") {
      return true;
    }
    if (settings.requireApprovalForAllRuns) {
      return true;
    }
    if (settings.permissionMode === "auto_review") {
      return safetyLevel >= 3;
    }
    return safetyLevel >= 2;
  }

  canAutoApplyPatch(changes: WebPatchChange[]): boolean {
    const settings = this.settings();
    if (!settings.allowWebPatchApply) {
      return false;
    }
    if (settings.permissionMode === "full_access") {
      return true;
    }
    if (settings.permissionMode !== "auto_review") {
      return false;
    }
    if (changes.length > 3) {
      return false;
    }
    const allowedPrefixes = ["src/", "public/", "docs/", "README", "QUICKSTART"];
    const riskyNames = ["package.json", "package-lock.json", ".env", "secret", "token", "key", "credential"];
    return changes.every((change) => {
      const normalized = change.filePath.replace(/\\/g, "/");
      const lower = normalized.toLowerCase();
      return allowedPrefixes.some((prefix) => normalized === prefix || normalized.startsWith(prefix))
        && !riskyNames.some((name) => lower.includes(name));
    });
  }

  assertMutationsAllowed(action: string): void {
    const settings = this.settings();
    if (settings.permissionMode === "read_only") {
      throw new Error(`${action} is blocked because permission mode is read_only`);
    }
  }

  needsApprovalForShell(command: ShellCommandRecord): boolean {
    const settings = this.settings();
    if (settings.permissionMode === "full_access") {
      return false;
    }
    if (command.classification === "dangerous") {
      return true;
    }
    if (command.classification === "read_only" && settings.permissionMode === "auto_review") {
      return false;
    }
    return true;
  }

  summarizeCodexApprovalPolicy(): ApprovalPolicy {
    return this.settings().codexApprovalPolicy;
  }
}
