import { nanoid } from "nanoid";

import { now, uniqueStrings } from "../../lib/common.js";
import { TaskArtifact, TaskConflict, TaskRecord } from "../../types.js";
import { StateStore } from "../state-store.js";

export class TaskStore {
  constructor(private readonly stateStore: StateStore) {}

  create(input: Omit<TaskRecord, "id" | "createdAt" | "updatedAt" | "artifacts" | "conflicts"> & { artifacts?: TaskArtifact[]; conflicts?: TaskConflict[] }): TaskRecord {
    const task: TaskRecord = {
      ...input,
      id: nanoid(10),
      artifacts: input.artifacts || [],
      conflicts: input.conflicts || [],
      claimedFiles: uniqueStrings(input.claimedFiles),
      taskBranchIds: uniqueStrings(input.taskBranchIds),
      contextPackIds: uniqueStrings(input.contextPackIds),
      retrievedContextIds: uniqueStrings(input.retrievedContextIds),
      patchIds: uniqueStrings(input.patchIds),
      executionJobIds: uniqueStrings(input.executionJobIds),
      shellCommandIds: uniqueStrings(input.shellCommandIds),
      approvals: uniqueStrings(input.approvals),
      logs: uniqueStrings(input.logs),
      createdAt: now(),
      updatedAt: now()
    };
    this.stateStore.update((state) => {
      state.tasks.push(task);
    });
    return task;
  }

  list(projectId?: string): TaskRecord[] {
    const state = this.stateStore.load();
    const tasks = projectId ? state.tasks.filter((task) => task.projectId === projectId) : state.tasks;
    return tasks.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  get(taskId: string): TaskRecord {
    const task = this.stateStore.load().tasks.find((item) => item.id === taskId);
    if (!task) {
      throw new Error("task not found");
    }
    return task;
  }

  update(taskId: string, mutate: (task: TaskRecord) => void): TaskRecord {
    return this.stateStore.update((state) => {
      const task = state.tasks.find((item) => item.id === taskId);
      if (!task) {
        throw new Error("task not found");
      }
      mutate(task);
      task.updatedAt = now();
      task.claimedFiles = uniqueStrings(task.claimedFiles);
      return task;
    });
  }

  detectConflicts(projectId: string, filePaths: string[], excludeTaskId?: string): TaskConflict[] {
    const wanted = new Set(filePaths.map((filePath) => filePath.toLowerCase()));
    const state = this.stateStore.load();
    const conflicts: TaskConflict[] = [];
    for (const task of state.tasks) {
      if (task.projectId !== projectId || task.id === excludeTaskId || ["completed", "cancelled", "failed"].includes(task.status)) {
        continue;
      }
      for (const filePath of task.claimedFiles) {
        if (wanted.has(filePath.toLowerCase())) {
          conflicts.push({
            taskId: task.id,
            taskTitle: task.taskTitle,
            filePath
          });
        }
      }
    }
    return conflicts;
  }

  linkArtifact(taskId: string, artifact: TaskArtifact): TaskRecord {
    return this.update(taskId, (task) => {
      task.artifacts.push(artifact);
      if (artifact.type === "context_pack") task.contextPackIds.push(artifact.id);
      if (artifact.type === "retrieved_context") task.retrievedContextIds.push(artifact.id);
      if (artifact.type === "patch") task.patchIds.push(artifact.id);
      if (artifact.type === "execution_job") task.executionJobIds.push(artifact.id);
      if (artifact.type === "shell_command") task.shellCommandIds.push(artifact.id);
      task.logs.push(`${artifact.type}:${artifact.id}`);
      if (artifact.filePaths?.length) {
        task.claimedFiles = uniqueStrings(task.claimedFiles.concat(artifact.filePaths));
      }
    });
  }
}
