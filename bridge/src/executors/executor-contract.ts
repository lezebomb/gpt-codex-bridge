import { AgentRun, ExecutionJob, ExecutorDescriptor, Project, TaskRecord } from "../types.js";

export type ExecutorRunInput = {
  job: ExecutionJob;
  task: TaskRecord;
  project: Project;
  run?: AgentRun;
};

export interface AgentExecutor {
  descriptor: ExecutorDescriptor;
  run(job: ExecutionJob, task: TaskRecord, project: Project): Promise<Partial<ExecutionJob>>;
  cancel?(runId: string): Promise<{ cancelled: boolean; reason: string }> | { cancelled: boolean; reason: string };
  dryRun?(job: ExecutionJob, task: TaskRecord, project: Project): Promise<Partial<ExecutionJob>> | Partial<ExecutionJob>;
  validateConfig?(): { ok: boolean; message?: string };
  getStatus?(): { ok: boolean; message?: string; details?: unknown };
}

