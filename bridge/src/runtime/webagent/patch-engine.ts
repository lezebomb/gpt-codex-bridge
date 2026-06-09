import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { nanoid } from "nanoid";

import { compactForLog, normalizePathSlashes, now, sha256Text } from "../../lib/common.js";
import { PatchConflictStatus, PatchPreflightReport, Project, TaskConflict, WebPatch, WebPatchChange } from "../../types.js";
import { readJsonFile, writeJsonFile } from "../../lib/common.js";
import { resolveProjectFile, validatePatchChanges } from "../../project-files.js";
import { LogStore } from "../log-store.js";
import { StateStore } from "../state-store.js";
import { ApprovalEngine } from "./approval-engine.js";
import { DiffManager } from "./diff-manager.js";
import { TaskBranchStore } from "./task-branch-store.js";
import { TaskStore } from "./task-store.js";

export class PatchEngine {
  constructor(
    private readonly stateStore: StateStore,
    private readonly taskStore: TaskStore,
    private readonly taskBranchStore: TaskBranchStore,
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

  private readGitHead(project: Project): string | undefined {
    const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd: project.path, env: process.env, encoding: "utf8" });
    if (result.status !== 0) {
      return undefined;
    }
    return String(result.stdout || "").trim() || undefined;
  }

  private readCurrentHash(project: Project, filePath: string) {
    const target = resolveProjectFile(project, filePath);
    if (!fs.existsSync(target)) {
      return { existed: false, contentHash: sha256Text("") };
    }
    return {
      existed: true,
      contentHash: sha256Text(fs.readFileSync(target, "utf8"))
    };
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
    const touchedFiles = changes.map((change) => normalizePathSlashes(change.filePath));
    const conflicts: TaskConflict[] = input.taskId
      ? this.taskStore.detectConflicts(project.id, touchedFiles, input.taskId)
      : this.taskStore.detectConflicts(project.id, touchedFiles);
    const patch: WebPatch = {
      id: nanoid(10),
      projectId: project.id,
      taskId: input.taskId,
      taskBranchId: input.taskBranchId,
      title: input.title,
      rationale: input.rationale || "",
      status: "needs_approval",
      changes,
      touchedFiles,
      baseGitHead: this.readGitHead(project),
      fileSnapshots: touchedFiles.map((filePath) => ({
        filePath,
        ...this.readCurrentHash(project, filePath)
      })),
      conflicts,
      createdBy: "chatgpt-web",
      events: [{ at: now(), type: "patch_created", message: "Patch draft created. Files are unchanged until apply.", data: compactForLog(changes) }],
      createdAt: now(),
      updatedAt: now()
    };
    patch.lastConflictStatus = this.getPatchConflictStatus(project, patch);
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
      details: { patchId: patch.id, files: touchedFiles, conflicts, conflictStatus: patch.lastConflictStatus }
    });
    if (input.taskId) {
      this.taskStore.linkArtifact(input.taskId, { id: patch.id, type: "patch", label: patch.title, filePaths: touchedFiles });
    }
    return patch;
  }

  diff(project: Project, patchId: string) {
    const patch = this.get(patchId);
    return this.diffManager.diffPatch(patch, project);
  }

  getPatchConflictStatus(project: Project, patchOrId: string | WebPatch): PatchConflictStatus {
    const patch = typeof patchOrId === "string" ? this.get(patchOrId) : patchOrId;
    const currentGitHead = this.readGitHead(project) || null;
    const branchConflicts = this.taskBranchStore.detectConflicts({
      projectId: project.id,
      taskBranchId: patch.taskBranchId,
      touchedFiles: patch.touchedFiles,
      baseGitHead: patch.baseGitHead,
      currentGitHead: currentGitHead || undefined
    });
    const changedFiles = patch.fileSnapshots
      .filter((snapshot) => {
        const current = this.readCurrentHash(project, snapshot.filePath);
        return current.existed !== snapshot.existed || current.contentHash !== snapshot.contentHash;
      })
      .map((snapshot) => snapshot.filePath);
    const stalePatch = Boolean(
      changedFiles.length
      || (patch.baseGitHead && currentGitHead && patch.baseGitHead !== currentGitHead)
    );
    const conflictDetected = stalePatch || branchConflicts.conflictingBranches.length > 0;
    const suggestedAction: PatchConflictStatus["suggestedAction"] = [];
    const blockingReasons: string[] = [];
    if (changedFiles.length) {
      blockingReasons.push(`Target files changed since the patch was drafted: ${changedFiles.join(", ")}`);
      suggestedAction.push("inspect_conflict", "rebase_patch");
    }
    if (patch.baseGitHead && currentGitHead && patch.baseGitHead !== currentGitHead) {
      blockingReasons.push("Patch baseGitHead is stale relative to the current git HEAD.");
      suggestedAction.push("refresh_context", "rebase_patch");
    }
    if (branchConflicts.conflictingBranches.length) {
      blockingReasons.push("Another active Task Branch touches overlapping files.");
      suggestedAction.push("inspect_conflict", "archive_conflicting_branch", "continue_with_manual_approval");
    }
    if (!suggestedAction.length) {
      suggestedAction.push("continue_with_manual_approval");
    }
    return {
      conflictDetected,
      stalePatch,
      overlappingFiles: branchConflicts.overlappingFiles,
      conflictingBranches: branchConflicts.conflictingBranches,
      changedFiles,
      baseGitHead: patch.baseGitHead || null,
      currentGitHead,
      suggestedAction: Array.from(new Set(suggestedAction)),
      blockingReasons,
      requiresApproval: conflictDetected
    };
  }

  preflightPatchApply(project: Project, patchOrId: string | WebPatch): PatchPreflightReport {
    const patch = typeof patchOrId === "string" ? this.get(patchOrId) : patchOrId;
    const conflictStatus = this.getPatchConflictStatus(project, patch);
    const branchConflict = conflictStatus.conflictingBranches.length > 0;
    const patchWouldOverwriteChanges = conflictStatus.changedFiles.length > 0;
    const needsManualApproval = conflictStatus.requiresApproval || branchConflict || patchWouldOverwriteChanges || Boolean(conflictStatus.stalePatch);
    const safeToApply = !needsManualApproval && patch.status === "needs_approval";
    const suggestedIsolationMode = branchConflict || conflictStatus.stalePatch || patch.touchedFiles.length > 3 ? "git_worktree" : "in_place";
    const preflightReport: PatchPreflightReport = {
      ...conflictStatus,
      safeToApply,
      branchConflict,
      patchWouldOverwriteChanges,
      needsManualApproval,
      suggestedIsolationMode,
      checkedAt: now(),
      preflightSummary: safeToApply
        ? "Patch preflight passed. No stale file snapshots or active Task Branch overlaps were detected."
        : `Patch preflight requires review: ${conflictStatus.blockingReasons.join(" | ") || "approval policy requires manual confirmation."}`
    };
    this.stateStore.update((state) => {
      const current = state.webPatches.find((item) => item.id === patch.id);
      if (current) {
        current.lastConflictStatus = conflictStatus;
        current.lastPreflightReport = preflightReport;
        current.updatedAt = now();
        current.events.push({ at: now(), type: "patch_preflight_checked", message: preflightReport.preflightSummary, data: preflightReport });
      }
    });
    return preflightReport;
  }

  apply(project: Project, patchId: string, source: "mcp" | "dashboard", requestId?: string) {
    const patch = this.get(patchId);
    if (patch.status !== "needs_approval") {
      throw new Error(`patch cannot be applied from status ${patch.status}`);
    }
    this.approvalEngine.assertMutationsAllowed("apply patch");
    const conflictStatus = this.preflightPatchApply(project, patch);
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
      target.lastConflictStatus = conflictStatus;
      target.events.push({
        at: now(),
        type: conflictStatus.conflictDetected ? "patch_applied_with_warning" : "patch_applied",
        message: conflictStatus.conflictDetected ? `Patch applied by ${source} with warnings.` : `Patch applied by ${source}.`,
        data: { applied, conflictStatus }
      });
    });
    this.logStore.write({
      level: conflictStatus.conflictDetected ? "warn" : "info",
      source,
      action: "apply_patch",
      message: conflictStatus.conflictDetected ? "Patch applied with stale/conflict warnings." : "Patch applied to local files.",
      requestId,
      projectId: project.id,
      taskId: patch.taskId,
      details: { patchId: patch.id, applied, conflictStatus }
    });
    return { applied, conflictStatus };
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
    const preflightReport = this.preflightPatchApply(project, patch);
    this.stateStore.update((state) => {
      const current = state.webPatches.find((item) => item.id === patch.id);
      if (current) {
        current.lastConflictStatus = preflightReport;
        current.lastPreflightReport = preflightReport;
        current.updatedAt = now();
      }
    });
    if (settings.permissionMode === "read_only") {
      return { applied: false, status: "blocked", reason: "read_only mode blocks file writes", patch, safeToApply: false, preflightReport, conflictStatus: preflightReport, conflictDetected: preflightReport.conflictDetected, stalePatch: preflightReport.stalePatch, requiresApproval: true, approvalRequired: true };
    }
    if (settings.permissionMode === "auto_review" && preflightReport.conflictDetected) {
      this.logStore.write({
        level: "warn",
        source: "mcp",
        action: "request_apply_patch",
        message: "Patch auto-apply blocked by stale base or Task Branch conflict.",
        requestId,
        projectId: project.id,
        taskId: patch.taskId,
        details: { patchId: patch.id, preflightReport }
      });
      return {
        applied: false,
        status: "needs_dashboard_approval",
        reason: "Patch requires manual approval because it is stale or overlaps another active Task Branch.",
        patch,
        safeToApply: false,
        preflightReport,
        conflictStatus: preflightReport,
        conflictDetected: true,
        stalePatch: preflightReport.stalePatch,
        requiresApproval: true,
        approvalRequired: true
      };
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
        details: { patchId: patch.id, preflightReport }
      });
      return {
        applied: false,
        status: "needs_dashboard_approval",
        reason: "Review and confirm the patch in Dashboard > Approvals or Tasks.",
        patch,
        safeToApply: preflightReport.safeToApply,
        preflightReport,
        conflictStatus: preflightReport,
        conflictDetected: preflightReport.conflictDetected,
        stalePatch: preflightReport.stalePatch,
        requiresApproval: true,
        approvalRequired: true
      };
    }
    const result = this.apply(project, patchId, "mcp", requestId);
    return {
      applied: true,
      status: "applied",
      patch: this.get(patchId),
      result,
      safeToApply: preflightReport.safeToApply,
      preflightReport,
      conflictStatus: preflightReport,
      conflictDetected: preflightReport.conflictDetected,
      stalePatch: preflightReport.stalePatch,
      requiresApproval: false
    };
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
