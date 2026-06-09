import fs from "node:fs";
import path from "node:path";

import { nanoid } from "nanoid";

import { EVENTS_DIR } from "../../config.js";
import { ensureDir, now, readJsonFile, writeJsonFile } from "../../lib/common.js";
import { AgentRun, ExecutorMode, RunStatus } from "../../types.js";

export class RunStore {
  constructor() {
    ensureDir(EVENTS_DIR);
  }

  private runsPath(): string {
    return path.join(EVENTS_DIR, "runs.json");
  }

  private loadAll(): AgentRun[] {
    const runs = readJsonFile<AgentRun[]>(this.runsPath(), []);
    return Array.isArray(runs) ? runs : [];
  }

  private saveAll(runs: AgentRun[]): void {
    writeJsonFile(this.runsPath(), runs);
  }

  create(input: {
    title: string;
    projectId?: string;
    taskId?: string;
    taskBranchId?: string;
    executorMode?: ExecutorMode;
    toolName?: string;
    requestId?: string;
    status?: RunStatus;
    metadata?: Record<string, unknown>;
  }): AgentRun {
    const run: AgentRun = {
      id: nanoid(12),
      projectId: input.projectId,
      taskId: input.taskId,
      taskBranchId: input.taskBranchId,
      executorMode: input.executorMode,
      status: input.status || "queued",
      title: input.title,
      toolName: input.toolName,
      requestId: input.requestId,
      createdAt: now(),
      updatedAt: now(),
      metadata: input.metadata
    };
    const runs = this.loadAll();
    runs.push(run);
    this.saveAll(runs);
    return run;
  }

  list(options?: { projectId?: string; taskId?: string; taskBranchId?: string; status?: RunStatus; limit?: number }): AgentRun[] {
    const limit = options?.limit ?? 100;
    return this.loadAll()
      .filter((run) => !options?.projectId || run.projectId === options.projectId)
      .filter((run) => !options?.taskId || run.taskId === options.taskId)
      .filter((run) => !options?.taskBranchId || run.taskBranchId === options.taskBranchId)
      .filter((run) => !options?.status || run.status === options.status)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit);
  }

  get(runId: string): AgentRun {
    const run = this.loadAll().find((item) => item.id === runId);
    if (!run) throw new Error("run not found");
    return run;
  }

  update(runId: string, mutate: (run: AgentRun) => void): AgentRun {
    const runs = this.loadAll();
    const run = runs.find((item) => item.id === runId);
    if (!run) throw new Error("run not found");
    mutate(run);
    run.updatedAt = now();
    if (["completed", "failed", "cancelled"].includes(run.status) && !run.completedAt) {
      run.completedAt = now();
    }
    this.saveAll(runs);
    return run;
  }

  start(runId: string): AgentRun {
    return this.update(runId, (run) => {
      run.status = "running";
      run.startedAt = run.startedAt || now();
    });
  }

  setStatus(runId: string, status: RunStatus, reason?: string): AgentRun {
    return this.update(runId, (run) => {
      run.status = status;
      if (reason) run.cancelReason = reason;
    });
  }

  cancel(runId: string, reason?: string): AgentRun {
    return this.setStatus(runId, "cancelled", reason || "Cancelled by user.");
  }

  storageInfo() {
    const filePath = this.runsPath();
    return { filePath, exists: fs.existsSync(filePath), count: this.loadAll().length };
  }
}

