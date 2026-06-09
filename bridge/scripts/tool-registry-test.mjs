import { BridgeService } from "../dist/bridge-service.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  const service = new BridgeService();
  const tools = service.getToolRegistry().tools;
  assert(tools.some((tool) => tool.name === "request_apply_patch" && tool.riskLevel === "high"), "request_apply_patch risk metadata missing");
  assert(tools.some((tool) => tool.name === "run_shell_command" && tool.requiresApproval), "run_shell_command approval metadata missing");
  assert(tools.some((tool) => tool.name === "get_tool_registry"), "get_tool_registry missing");
  const explanation = service.explainToolRisk({ toolName: "create_execution_job" });
  assert(explanation.summary.includes("create_execution_job"), "risk explanation should mention the tool");
  console.log("Tool registry test passed.");
}

main();

