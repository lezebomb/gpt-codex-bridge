import fs from "node:fs";

import { EXTERNAL_EXECUTOR_CONFIG_FILE } from "../config.js";
import { readJsonFile, writeJsonFile } from "../lib/common.js";
import { ExecutionJob, ExternalExecutorConfig, Project, TaskRecord } from "../types.js";
import { AgentExecutor } from "./executor-contract.js";

const DEFAULT_EXTERNAL_EXECUTORS: ExternalExecutorConfig[] = [
  {
    id: "claude-code-cli",
    name: "Claude Code-compatible CLI",
    command: "claude-code",
    args: ["--json"],
    cwdMode: "project",
    env: {},
    enabled: false,
    riskLevel: "high"
  },
  {
    id: "deepseek-coder-cli",
    name: "DeepSeek Coder CLI",
    command: "deepseek-coder",
    args: ["--json"],
    cwdMode: "project",
    env: {},
    enabled: false,
    riskLevel: "high"
  },
  {
    id: "openrouter-agent",
    name: "OpenRouter Agent",
    command: "openrouter-agent",
    args: ["--json"],
    cwdMode: "project",
    env: {},
    enabled: false,
    riskLevel: "high"
  }
];

export class ExternalExecutor implements AgentExecutor {
  readonly descriptor = {
    id: "external" as const,
    name: "External",
    description: "Configurable external CLI executor preview. No provider is hardcoded into Bridge runtime behavior.",
    capabilities: { canReadFiles: true, canWriteFiles: true, canRunShell: true, canUseMcp: false, canUseNetwork: true, canUseGit: true, canRunTests: true, canUseExternalModel: true },
    riskLevel: "critical" as const,
    supportsCancel: false,
    supportsDryRun: true,
    supportsStreaming: false,
    supportsWorkspaceIsolation: true
  };

  list(): ExternalExecutorConfig[] {
    if (!fs.existsSync(EXTERNAL_EXECUTOR_CONFIG_FILE)) {
      writeJsonFile(EXTERNAL_EXECUTOR_CONFIG_FILE, DEFAULT_EXTERNAL_EXECUTORS);
    }
    return readJsonFile(EXTERNAL_EXECUTOR_CONFIG_FILE, DEFAULT_EXTERNAL_EXECUTORS);
  }

  cancel(runId: string) {
    return { cancelled: false, reason: `External executor run ${runId} is currently a dry-run preview; no child process is tracked to cancel.` };
  }

  async run(job: ExecutionJob, task: TaskRecord, project: Project): Promise<Partial<ExecutionJob>> {
    const config = this.list().find((item) => item.id === job.externalExecutorId);
    const lines = [
      "External executor stub.",
      `Project: ${project.name}`,
      `Task: ${task.taskTitle}`,
      config
        ? `Configured command preview: ${config.command} ${config.args.join(" ")}`
        : "No enabled external executor was selected.",
      "Current implementation intentionally stops at dry-run/preview so the bridge does not silently hardcode a third-party agent."
    ];
    return {
      status: "completed",
      result: lines.join("\n"),
      exitCode: 0,
      stdout: lines.join("\n"),
      stderr: ""
    };
  }
}
