import { ExecutionJob, Project, TaskRecord } from "../types.js";

export class WebAgentExecutor {
  async run(job: ExecutionJob, task: TaskRecord, project: Project): Promise<Partial<ExecutionJob>> {
    const lines = [
      "WebAgent executor selected.",
      "This bridge does not call another model here; the ChatGPT orchestrator should continue via MCP.",
      `Project: ${project.name}`,
      `Task: ${task.taskTitle}`,
      "",
      "Recommended next tools:",
      "1. inspect_project",
      "2. read_file",
      "3. create_context_pack",
      "4. propose_web_patch",
      "5. get_patch_diff",
      "6. request_apply_patch",
      "7. run_shell_command (only if needed)"
    ];
    return {
      status: "completed",
      result: lines.join("\n"),
      stdout: "",
      stderr: "",
      exitCode: 0
    };
  }
}
