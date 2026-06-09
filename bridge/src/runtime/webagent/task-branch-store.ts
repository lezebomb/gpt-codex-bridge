import { nanoid } from "nanoid";

import { now, uniqueStrings } from "../../lib/common.js";
import { TaskArtifact, TaskBranchRecord } from "../../types.js";
import { StateStore } from "../state-store.js";

export class TaskBranchStore {
  constructor(private readonly stateStore: StateStore) {}

  create(input: Omit<TaskBranchRecord, "id" | "createdAt" | "updatedAt" | "lastActiveAt">): TaskBranchRecord {
    const branch: TaskBranchRecord = {
      ...input,
      id: nanoid(10),
      isolationMode: input.isolationMode || "in_place",
      worktreeStatus: input.worktreeStatus || "not_created",
      runIds: uniqueStrings(input.runIds || []),
      touchedFiles: uniqueStrings(input.touchedFiles),
      patchIds: uniqueStrings(input.patchIds),
      contextPackIds: uniqueStrings(input.contextPackIds),
      retrievedContextIds: uniqueStrings(input.retrievedContextIds),
      approvalIds: uniqueStrings(input.approvalIds),
      logRequestIds: uniqueStrings(input.logRequestIds),
      createdAt: now(),
      updatedAt: now(),
      lastActiveAt: now()
    };
    this.stateStore.update((state) => {
      state.taskBranches.push(branch);
    });
    return branch;
  }

  list(projectId?: string, taskId?: string): TaskBranchRecord[] {
    const branches = this.stateStore.load().taskBranches.filter((branch) => {
      if (projectId && branch.projectId !== projectId) return false;
      if (taskId && branch.taskId !== taskId) return false;
      return true;
    });
    return branches.sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt));
  }

  get(taskBranchId: string): TaskBranchRecord {
    const branch = this.stateStore.load().taskBranches.find((item) => item.id === taskBranchId);
    if (!branch) throw new Error("task branch not found");
    return branch;
  }

  update(taskBranchId: string, mutate: (branch: TaskBranchRecord) => void): TaskBranchRecord {
    return this.stateStore.update((state) => {
      const branch = state.taskBranches.find((item) => item.id === taskBranchId);
      if (!branch) throw new Error("task branch not found");
      mutate(branch);
      branch.updatedAt = now();
      branch.lastActiveAt = now();
      branch.touchedFiles = uniqueStrings(branch.touchedFiles);
      branch.patchIds = uniqueStrings(branch.patchIds);
      branch.contextPackIds = uniqueStrings(branch.contextPackIds);
      branch.retrievedContextIds = uniqueStrings(branch.retrievedContextIds);
      branch.approvalIds = uniqueStrings(branch.approvalIds);
      branch.logRequestIds = uniqueStrings(branch.logRequestIds);
      branch.runIds = uniqueStrings(branch.runIds || []);
      branch.isolationMode = branch.isolationMode || "in_place";
      branch.worktreeStatus = branch.worktreeStatus || "not_created";
      return branch;
    });
  }

  linkRun(taskBranchId: string, runId: string): TaskBranchRecord {
    return this.update(taskBranchId, (branch) => {
      branch.activeRunId = runId;
      branch.runIds.push(runId);
    });
  }

  linkArtifact(taskBranchId: string, artifact: TaskArtifact): TaskBranchRecord {
    return this.update(taskBranchId, (branch) => {
      if (artifact.type === "patch") branch.patchIds.push(artifact.id);
      if (artifact.type === "context_pack") branch.contextPackIds.push(artifact.id);
      if (artifact.type === "retrieved_context") branch.retrievedContextIds.push(artifact.id);
      if (artifact.meta?.requestId && typeof artifact.meta.requestId === "string") {
        branch.logRequestIds.push(artifact.meta.requestId);
      }
      if (artifact.filePaths?.length) {
        branch.touchedFiles = uniqueStrings(branch.touchedFiles.concat(artifact.filePaths));
      }
    });
  }

  detectConflicts(input: { projectId: string; taskBranchId?: string; touchedFiles: string[]; baseGitHead?: string; currentGitHead?: string }) {
    const wanted = new Set(input.touchedFiles.map((item) => item.toLowerCase()));
    const conflictingBranches = this.stateStore.load().taskBranches
      .filter((branch) => branch.projectId === input.projectId && branch.id !== input.taskBranchId && ["active", "paused"].includes(branch.status))
      .filter((branch) => branch.touchedFiles.some((filePath) => wanted.has(filePath.toLowerCase())))
      .map((branch) => ({
        taskBranchId: branch.id,
        taskId: branch.taskId,
        branchName: branch.branchName,
        overlappingFiles: branch.touchedFiles.filter((filePath) => wanted.has(filePath.toLowerCase()))
      }));
    const overlappingFiles = uniqueStrings(conflictingBranches.flatMap((branch) => branch.overlappingFiles));
    const stale = Boolean(input.baseGitHead && input.currentGitHead && input.baseGitHead !== input.currentGitHead);
    return {
      conflictingBranches,
      overlappingFiles,
      currentGitHead: input.currentGitHead || null,
      baseGitHead: input.baseGitHead || null,
      suggestedAction: stale
        ? "Refresh context, review git diff, and re-check patch applicability before writing files."
        : conflictingBranches.length
          ? "Coordinate touchedFiles across branches or finish one branch before applying overlapping patches."
          : "No active branch conflicts detected."
    };
  }
}
