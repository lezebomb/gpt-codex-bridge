import { ExecutionJob, Project, TaskRecord } from "../types.js";
import { AgentExecutor } from "./executor-contract.js";

export class WebAgentExecutor implements AgentExecutor {
  readonly descriptor = {
    id: "webagent" as const,
    name: "WebAgent",
    description: "ChatGPT Web drives local MCP tools while Bridge manages context, patching, approvals, and logs.",
    capabilities: { canReadFiles: true, canWriteFiles: true, canRunShell: false, canUseMcp: true, canUseNetwork: false, canUseGit: false, canRunTests: false, canUseExternalModel: false },
    riskLevel: "medium" as const,
    supportsCancel: true,
    supportsDryRun: true,
    supportsStreaming: false,
    supportsWorkspaceIsolation: false
  };

  cancel(runId: string) {
    return { cancelled: true, reason: `WebAgent run ${runId} is state-driven; cancellation marks the run and stops further bridge actions.` };
  }

  async run(job: ExecutionJob, task: TaskRecord, project: Project): Promise<Partial<ExecutionJob>> {
    const payload = {
      executor: "webagent",
      mode: "chatgpt-web-driven-local-runtime",
      project: project.name,
      taskId: task.id,
      taskTitle: task.taskTitle,
      taskState: task.status,
      recommendedNextAction: task.recommendedNextAction || "retrieve_context",
      availableTools: [
        "inspect_project",
        "index_project",
        "retrieve_context",
        "continue_task",
        "propose_web_patch",
        "request_apply_patch",
        "run_shell_command",
        "analyze_error_log",
        "create_repair_proposal"
      ],
      note: "Reasoning stays in ChatGPT Web. This runtime exposes local project context, patching, shell approvals, logs, and repair flows."
    };
    return {
      status: "completed",
      result: JSON.stringify(payload, null, 2),
      stdout: "",
      stderr: "",
      exitCode: 0
    };
  }
}
