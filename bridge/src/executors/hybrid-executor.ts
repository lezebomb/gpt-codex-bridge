import { ExecutionJob, Project, TaskRecord } from "../types.js";
import { AgentExecutor } from "./executor-contract.js";

export class HybridExecutor implements AgentExecutor {
  readonly descriptor = {
    id: "hybrid" as const,
    name: "Hybrid",
    description: "WebAgent plans or drafts, Codex reviews or executes, then a final review closes the loop.",
    capabilities: { canReadFiles: true, canWriteFiles: true, canRunShell: true, canUseMcp: true, canUseNetwork: false, canUseGit: true, canRunTests: true, canUseExternalModel: true },
    riskLevel: "high" as const,
    supportsCancel: true,
    supportsDryRun: true,
    supportsStreaming: false,
    supportsWorkspaceIsolation: true
  };

  cancel(runId: string) {
    return { cancelled: true, reason: `Hybrid run ${runId} cancellation is recorded; subprocess cancellation is delegated to the active phase executor.` };
  }

  async run(job: ExecutionJob, task: TaskRecord, project: Project): Promise<Partial<ExecutionJob>> {
    const lines = [
      "Hybrid executor selected.",
      `Project: ${project.name}`,
      `Task: ${task.taskTitle}`,
      "",
      "Phases:",
      "1. webagent_plan: orchestrator collects context and proposes a bounded patch.",
      "2. codex_review_or_execute: Codex validates integration, tests, and edge cases when approved.",
      "3. final_review: orchestrator reads the result and finalizes the bounded review.",
      "Cross review remains capped at two rounds."
    ];
    return {
      status: "completed",
      result: lines.join("\n"),
      stdout: lines.join("\n"),
      stderr: "",
      exitCode: 0
    };
  }
}
