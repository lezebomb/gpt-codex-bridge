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
  const isolatedProjectPath = path.join(os.tmpdir(), `bridge-preflight-${Date.now()}`);
  fs.cpSync(demoProjectPath, isolatedProjectPath, { recursive: true });
  return isolatedProjectPath;
}

function main() {
  const service = new BridgeService();
  const projectPath = isolatedDemoProject();
  const selected = service.selectProject({ path: projectPath, displayName: path.basename(projectPath) });
  const created = service.createTask({ projectId: selected.project.id, taskGoal: "Patch preflight smoke", targetFiles: ["README.md"] });
  const patch = service.proposeWebPatch({ projectId: selected.project.id, taskId: created.task.id, taskBranchId: created.defaultTaskBranch.id, title: "README", changes: [{ filePath: "README.md", mode: "overwrite", content: "# preflight\n" }] });
  const clean = service.preflightPatchApply(patch.id);
  assert(clean.safeToApply === true, "clean patch should be safe to apply in preflight");
  fs.writeFileSync(path.join(projectPath, "README.md"), "# changed outside patch\n", "utf8");
  const stale = service.preflightPatchApply(patch.id);
  assert(stale.stalePatch === true, "preflight should detect stale patch");
  assert(stale.patchWouldOverwriteChanges === true, "preflight should report overwrite risk");
  assert(stale.requiresApproval === true, "stale patch should require approval");
  console.log("Patch preflight test passed.");
}

main();

