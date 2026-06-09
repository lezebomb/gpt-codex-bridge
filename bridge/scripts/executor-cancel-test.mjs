import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { BridgeService } from "../dist/bridge-service.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isolatedDemoProject() {
  const repoRoot = path.resolve(process.cwd(), "..");
  const demoProjectPath = path.join(repoRoot, "examples", "demo-project");
  const isolatedProjectPath = path.join(os.tmpdir(), `bridge-cancel-${Date.now()}`);
  fs.cpSync(demoProjectPath, isolatedProjectPath, { recursive: true });
  return isolatedProjectPath;
}

async function main() {
  const service = new BridgeService();
  const projectPath = isolatedDemoProject();
  const selected = service.selectProject({ path: projectPath, displayName: path.basename(projectPath) });
  const created = service.createTask({ projectId: selected.project.id, taskGoal: "Executor cancel smoke", executorMode: "webagent" });
  const execution = await service.createExecutionJob({ taskId: created.task.id, taskBranchId: created.defaultTaskBranch.id, executorMode: "webagent", runImmediately: false }, "cancel-test");
  assert(execution.runId, "create_execution_job should return runId");
  const cancelled = service.cancelRun({ runId: execution.runId, reason: "smoke test" });
  assert(cancelled.run.status === "cancelled", "run should be marked cancelled");
  const events = service.getRunEvents({ runId: execution.runId });
  assert(events.some((event) => event.type === "run.cancelled"), "run.cancelled event missing");
  console.log("Executor cancel test passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

