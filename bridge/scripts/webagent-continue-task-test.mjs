import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { BridgeService } from "../dist/bridge-service.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const service = new BridgeService();
  const repoRoot = path.resolve(process.cwd(), "..");
  const demoProjectPath = path.join(repoRoot, "examples", "demo-project");
  const isolatedProjectPath = path.join(os.tmpdir(), `bridge-webagent-continue-${Date.now()}`);
  fs.cpSync(demoProjectPath, isolatedProjectPath, { recursive: true });
  const selected = service.selectProject({ path: isolatedProjectPath, displayName: path.basename(isolatedProjectPath) });

  const created = service.createTask({
    projectId: selected.project.id,
    taskTitle: "Continue task test",
    taskGoal: "Review App rendering flow and propose a targeted patch.",
    targetFiles: ["src/App.tsx"]
  });
  assert(created.defaultTaskBranch?.id, "createTask should create a default task branch");
  assert(created.task.executorLocked === true, "task executor should be locked at creation");

  const firstContinue = await service.continueTask({ taskId: created.task.id, taskBranchId: created.defaultTaskBranch.id });
  assert(firstContinue.recommendedNextAction === "retrieve_context", `Expected retrieve_context first, got ${firstContinue.recommendedNextAction}`);

  const retrieved = service.retrieveContext({
    projectId: selected.project.id,
    taskId: created.task.id,
    taskBranchId: created.defaultTaskBranch.id,
    query: "Start workflow",
    purpose: "Prepare WebAgent patch plan"
  });
  assert(retrieved.relevantFiles.length > 0, "retrieveContext should link relevant files");

  const secondContinue = await service.continueTask({ taskId: created.task.id, taskBranchId: created.defaultTaskBranch.id });
  assert(["propose_web_patch", "request_apply_patch", "verify_or_repair"].includes(secondContinue.recommendedNextAction), "continueTask should become stateful after context retrieval");

  const branch = service.createTaskBranch({ taskId: created.task.id, branchName: "parallel-fix", touchedFiles: ["src/App.tsx"] });
  const conflicts = service.detectBranchConflicts({ taskBranchId: branch.id });
  assert(
    conflicts.overlappingFiles.map((filePath) => filePath.replaceAll("\\", "/")).includes("src/App.tsx"),
    "branch conflict detection should report overlapping files"
  );

  console.log("WebAgent continue_task test passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
