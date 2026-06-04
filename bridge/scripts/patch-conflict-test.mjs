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
  const isolatedProjectPath = path.join(os.tmpdir(), `bridge-patch-conflict-${Date.now()}`);
  fs.cpSync(demoProjectPath, isolatedProjectPath, { recursive: true });
  return isolatedProjectPath;
}

async function main() {
  const service = new BridgeService();
  const isolatedProjectPath = isolatedDemoProject();
  const selected = service.selectProject({ path: isolatedProjectPath, displayName: path.basename(isolatedProjectPath) });
  const created = service.createTask({
    projectId: selected.project.id,
    taskTitle: "Patch conflict test",
    taskGoal: "Update README safely.",
    targetFiles: ["README.md"]
  });

  const patch = service.proposeWebPatch({
    projectId: selected.project.id,
    taskId: created.task.id,
    taskBranchId: created.defaultTaskBranch.id,
    title: "README patch",
    changes: [{ filePath: "README.md", mode: "overwrite", content: "# changed\n" }]
  });

  service.createTaskBranch({
    taskId: created.task.id,
    branchName: "parallel-readme-change",
    touchedFiles: ["README.md"]
  });

  const branchConflict = service.requestApplyPatch(patch.id);
  assert(branchConflict.conflictDetected === true, "request_apply_patch should detect overlapping Task Branch files");
  assert(branchConflict.requiresApproval === true, "conflicting patch should require manual approval");

  fs.writeFileSync(path.join(isolatedProjectPath, "README.md"), "# externally changed\n", "utf8");
  const staleStatus = service.getPatchConflictStatus(patch.id);
  assert(staleStatus.stalePatch === true, "patch should become stale after target file changes");

  console.log("Patch conflict test passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
