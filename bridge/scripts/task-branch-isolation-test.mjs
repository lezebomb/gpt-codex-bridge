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
  const isolatedProjectPath = path.join(os.tmpdir(), `bridge-isolation-${Date.now()}`);
  fs.cpSync(demoProjectPath, isolatedProjectPath, { recursive: true });
  return isolatedProjectPath;
}

function main() {
  const service = new BridgeService();
  const projectPath = isolatedDemoProject();
  const selected = service.selectProject({ path: projectPath, displayName: path.basename(projectPath) });
  const created = service.createTask({ projectId: selected.project.id, taskGoal: "Isolation smoke", targetFiles: ["README.md"], executorMode: "webagent" });
  assert(created.defaultTaskBranch.isolationMode === "in_place", "default isolation should be in_place");
  assert(created.defaultTaskBranch.worktreeStatus === "not_created", "worktree should not be created by default");
  const recommendation = service.recommendIsolationMode({ taskBranchId: created.defaultTaskBranch.id });
  assert(recommendation.isolationMode, "recommendation should include isolationMode");
  const status = service.getTaskWorktreeStatus(created.defaultTaskBranch.id);
  assert(status.workspacePath, "worktree status should include workspacePath");
  console.log("Task branch isolation test passed.");
}

main();

