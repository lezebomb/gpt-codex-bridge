import fs from "node:fs";
import path from "node:path";

import { nanoid } from "nanoid";

import { compactForLog, now } from "../../lib/common.js";
import { Project, TaskConflict, WebPatch, WebPatchChange } from "../../types.js";
import { readJsonFile, writeJsonFile } from "../../lib/common.js";
import { resolveProjectFile, validatePatchChanges } from "../../project-files.js";
import { LogStore } from "../log-store.js";
import { StateStore } from "../state-store.js";
import { ApprovalEngine } from "./approval-engine.js";
import { DiffManager } from "./diff-manager.js";
import { TaskStore } from "./task-store.js";

export class PatchEngine {
  constructor(
    private readonly stateStore: StateStore,
    private readonly taskStore: TaskStore,
    private readonly approvalEngine: ApprovalEngine,
    private readonly diffManager: DiffManager,
    private readonly logStore: LogStore
  ) {}

  private backupDir(project: Project, patchId: string): string {
    return path.join(project.path, ".chatgpt-codex", "patch-backups", patchId);
  }

  private metadataPath(project: Project, patchId: string): string {
    return path.join(this.backupDir(project, patchId), "metadata.json");
  }

  list(): WebPatch[] {
    return this.stateStore.load().webPatches.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(patchId: string): WebPatch {
    const patch = this.stateStore.load().webPatches.find((item) => item.id === patchId);
    if (!patch) {
      throw new Error("patch not found");
    }
    return patch;
  }

  create(project: Project, input: { taskId?: string; taskBranchId?: string; title: string; rationale?: string; changes: WebPatchChange[] }, requestId?: string): WebPatch {
    const changes = validatePatchChanges(project, input.changes);
    const conflicts: TaskConflict[] = input.taskId
      ? this.taskStore.detectConflicts(project.id, changes.map((change) => change.filePath), input.taskId)
      : this.taskStore.detectConflicts(project.id, changes.map((change) => change.filePath));
    const patch: WebPatch = {
      id: nanoid(10),
      projectId: project.id,
      taskId: input.taskId,
      taskBranchId: input.taskBranchId,
      title: input.title,
      rationale: input.rationale || "",
      status: "needs_approval",
      changes,
      conflicts,
      createdBy: "chatgpt-web",
      events: [{ at: now(), type: "patch_created", message: "Patch draft created. Files are unchanged until apply.", data: compactForLog(changes) }],
      createdAt: now(),
      updatedAt: now()
    };
    this.stateStore.update((state) => {
      state.webPatches.push(patch);
    });
    this.logStore.write({
      level: conflicts.length ? "warn" : "info",
      source: "mcp",
      action: "propose_web_patch",
      message: conflicts.length ? "Patch draft created with task conflicts." : "Patch draft created.",
      requestId,
      projectId: project.id,
      taskId: input.taskId,
      details: { patchId: patch.id, files: changes.map((change) => change.filePath), conflicts }
    });
    if (input.taskId) {
      this.taskStore.linkArtifact(input.taskId, { id: patch.id, type: "patch", label: patch.title, filePaths: changes.map((change) => change.filePath) });
    }
    return patch;
  }

  diff(project: Project, patchId: string) {
    const patch = this.get(patchId);
    return this.diffManager.diffPatch(patch, project);
  }

  apply(project: Project, patchId: string, source: "mcp" | "dashboard", requestId?: string) {
    const patch = this.get(patchId);
    if (patch.status !== "needs_approval") {
      throw new Error(`patch cannot be applied from status ${patch.status}`);
    }
    this.approvalEngine.assertMutationsAllowed("apply patch");
    const backupDir = this.backupDir(project, patch.id);
    fs.mkdirSync(backupDir, { recursive: true });
    const applied: Array<{ filePath: string; backupPath?: string; mode: string }> = [];
    for (const change of validatePatchChanges(project, patch.changes)) {
      const target = resolveProjectFile(project, change.filePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      let backupPath: string | undefined;
      if (fs.existsSync(target)) {
        backupPath = path.join(backupDir, change.filePath.replace(/[\\/]/g, "__"));
        fs.copyFileSync(target, backupPath);
      }
      fs.writeFileSync(target, change.content, "utf8");
      applied.push({ filePath: change.filePath, backupPath, mode: change.mode });
    }
    writeJsonFile(this.metadataPath(project, patch.id), { patchId: patch.id, appliedAt: now(), applied });
    this.stateStore.update((state) => {
      const target = state.webPatches.find((item) => item.id === patch.id);
      if (!target) throw new Error("patch not found");
      target.status = "applied";
      target.appliedAt = now();
      target.updatedAt = now();
      target.events.push({ at: now(), type: "patch_applied", message: `Patch applied by ${source}.`, data: { applied } });
    });
    this.logStore.write({
      level: "warn",
      source,
      action: "apply_patch",
      message: "Patch applied to local files.",
      requestId,
      projectId: project.id,
      taskId: patch.taskId,
      details: { patchId: patch.id, applied }
    });
    return { applied };
  }

  revert(project: Project, patchId: string, source: "mcp" | "dashboard", requestId?: string) {
    const patch = this.get(patchId);
    if (patch.status !== "applied") {
      throw new Error(`patch cannot be reverted from status ${patch.status}`);
    }
    this.approvalEngine.assertMutationsAllowed("revert patch");
    const metadata = readJsonFile<{ applied: Array<{ filePath: string; backupPath?: string }> }>(this.metadataPath(project, patch.id), { applied: [] });
    if (!Array.isArray(metadata.applied) || !metadata.applied.length) {
      throw new Error("patch backup metadata not found; cannot safely revert");
    }
    const reverted: Array<{ filePath: string; action: string }> = [];
    for (const item of metadata.applied.slice().reverse()) {
      const target = resolveProjectFile(project, item.filePath);
      if (item.backupPath && fs.existsSync(item.backupPath)) {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(item.backupPath, target);
        reverted.push({ filePath: item.filePath, action: "restored_backup" });
      } else if (fs.existsSync(target)) {
        fs.unlinkSync(target);
        reverted.push({ filePath: item.filePath, action: "removed_created_file" });
      } else {
        reverted.push({ filePath: item.filePath, action: "already_missing" });
      }
    }
    this.stateStore.update((state) => {
      const target = state.webPatches.find((item) => item.id === patch.id);
      if (!target) throw new Error("patch not found");
      target.status = "reverted";
      target.updatedAt = now();
      target.events.push({ at: now(), type: "patch_reverted", message: `Patch reverted by ${source}.`, data: { reverted } });
    });
    this.logStore.write({
      level: "warn",
      source,
      action: "revert_patch",
      message: "Patch reverted from local backup.",
      requestId,
      projectId: project.id,
      taskId: patch.taskId,
      details: { patchId: patch.id, reverted }
    });
    return { reverted };
  }

  reject(patchId: string, reason?: string) {
    return this.stateStore.update((state) => {
      const patch = state.webPatches.find((item) => item.id === patchId);
      if (!patch) throw new Error("patch not found");
      if (patch.status === "applied") throw new Error("applied patches cannot be rejected");
      patch.status = "rejected";
      patch.rejectedAt = now();
      patch.updatedAt = now();
      patch.events.push({ at: now(), type: "patch_rejected", message: reason || "Rejected by user." });
      return patch;
    });
  }

  requestApply(project: Project, patchId: string, requestId?: string) {
    const patch = this.get(patchId);
    if (patch.status !== "needs_approval") {
      throw new Error(`patch cannot be applied from status ${patch.status}`);
    }
    const settings = this.approvalEngine.currentSettings();
    if (settings.permissionMode === "read_only") {
      return { applied: false, status: "blocked", reason: "read_only mode blocks file writes", patch };
    }
    if (!this.approvalEngine.canAutoApplyPatch(patch.changes)) {
      this.logStore.write({
        level: "warn",
        source: "mcp",
        action: "request_apply_patch",
        message: "Patch apply requires dashboard confirmation.",
        requestId,
        projectId: project.id,
        taskId: patch.taskId,
        details: { patchId: patch.id }
      });
      return { applied: false, status: "needs_dashboard_approval", reason: "Review and confirm the patch in Dashboard > Approvals or Tasks.", patch };
    }
    const result = this.apply(project, patchId, "mcp", requestId);
    return { applied: true, status: "applied", patch: this.get(patchId), result };
  }

  requestRevert(project: Project, patchId: string, requestId?: string) {
    const patch = this.get(patchId);
    if (patch.status !== "applied") {
      throw new Error(`patch cannot be reverted from status ${patch.status}`);
    }
    const settings = this.approvalEngine.currentSettings();
    if (settings.permissionMode !== "full_access") {
      this.logStore.write({
        level: "warn",
        source: "mcp",
        action: "request_revert_patch",
        message: "Patch revert requires dashboard confirmation.",
        requestId,
        projectId: project.id,
        taskId: patch.taskId,
        details: { patchId: patch.id }
      });
      return { reverted: false, status: settings.permissionMode === "read_only" ? "blocked" : "needs_dashboard_approval", reason: "Reverting changes modifies files. Confirm it from Dashboard.", patch };
    }
    const result = this.revert(project, patchId, "mcp", requestId);
    return { reverted: true, status: "reverted", patch: this.get(patchId), result };
  }
}
