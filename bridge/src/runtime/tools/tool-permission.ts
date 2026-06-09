import { ApprovalActionType, PermissionMode, ToolRiskLevel } from "../../types.js";

type Decision = {
  allowed: boolean;
  requiresApproval: boolean;
  suggestedDecision: "approve" | "reject" | "inspect";
  auditWarning?: string;
  reason: string;
};

const AUTO_REVIEW_ALLOWED = new Set<ApprovalActionType>([
  "file_read",
  "context_index",
  "retrieve_context",
  "patch_draft",
  "shell_readonly"
]);

const AUTO_REVIEW_APPROVAL = new Set<ApprovalActionType>([
  "patch_apply",
  "patch_revert",
  "shell_write",
  "dependency_install",
  "git_write",
  "external_executor",
  "workspace_delete",
  "network_access",
  "worktree_create"
]);

export class ApprovalPolicyEngine {
  decide(input: { mode: PermissionMode; actionType: ApprovalActionType; riskLevel?: ToolRiskLevel; conflictDetected?: boolean }): Decision {
    if (input.mode === "read_only") {
      const allowed = ["file_read", "context_index", "retrieve_context"].includes(input.actionType);
      return {
        allowed,
        requiresApproval: !allowed,
        suggestedDecision: allowed ? "approve" : "reject",
        reason: allowed ? "read_only permits safe read/context actions." : "read_only blocks mutating or external actions."
      };
    }

    if (input.mode === "manual_review") {
      const readOnly = ["file_read", "context_index", "retrieve_context", "patch_draft"].includes(input.actionType);
      return {
        allowed: true,
        requiresApproval: !readOnly,
        suggestedDecision: readOnly ? "approve" : "inspect",
        reason: readOnly ? "manual_review allows low-risk preparation." : "manual_review requires approval for side effects."
      };
    }

    if (input.mode === "auto_review") {
      if (AUTO_REVIEW_ALLOWED.has(input.actionType) && !input.conflictDetected) {
        return { allowed: true, requiresApproval: false, suggestedDecision: "approve", reason: "auto_review allows this low-risk action." };
      }
      if (AUTO_REVIEW_APPROVAL.has(input.actionType) || input.conflictDetected) {
        return { allowed: true, requiresApproval: true, suggestedDecision: "inspect", reason: "auto_review requires review for writes, external access, or conflicts." };
      }
      return { allowed: true, requiresApproval: input.riskLevel === "high" || input.riskLevel === "critical", suggestedDecision: "inspect", reason: "auto_review falls back to risk-based review." };
    }

    return {
      allowed: true,
      requiresApproval: false,
      suggestedDecision: "approve",
      auditWarning: "full_access bypasses approval gates but the bridge still records an audit warning.",
      reason: "full_access allows the action."
    };
  }
}

