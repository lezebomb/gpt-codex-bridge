import { ExecutionJob, Project, TaskRecord } from "../types.js";

export class WebAgentExecutor {
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
