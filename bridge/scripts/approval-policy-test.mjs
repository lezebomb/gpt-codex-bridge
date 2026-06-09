import { ApprovalPolicyEngine } from "../dist/runtime/tools/tool-permission.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  const policy = new ApprovalPolicyEngine();
  assert(policy.decide({ mode: "auto_review", actionType: "file_read" }).requiresApproval === false, "auto_review should allow file_read");
  assert(policy.decide({ mode: "auto_review", actionType: "context_index" }).requiresApproval === false, "auto_review should allow context_index");
  assert(policy.decide({ mode: "auto_review", actionType: "retrieve_context" }).requiresApproval === false, "auto_review should allow retrieve_context");
  assert(policy.decide({ mode: "auto_review", actionType: "patch_draft" }).requiresApproval === false, "auto_review should allow patch_draft");
  assert(policy.decide({ mode: "auto_review", actionType: "shell_readonly" }).requiresApproval === false, "auto_review should allow shell_readonly");
  assert(policy.decide({ mode: "auto_review", actionType: "patch_apply" }).requiresApproval === true, "auto_review should require patch_apply approval");
  assert(policy.decide({ mode: "auto_review", actionType: "dependency_install" }).requiresApproval === true, "auto_review should require dependency_install approval");
  assert(policy.decide({ mode: "full_access", actionType: "git_write" }).auditWarning, "full_access should include audit warning");
  console.log("Approval policy test passed.");
}

main();

