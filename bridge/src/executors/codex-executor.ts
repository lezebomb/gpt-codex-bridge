import { spawn } from "node:child_process";
import readline from "node:readline";

import { CODEX_APP_SERVER_MODEL, CODEX_ARGS, CODEX_BIN, CODEX_JOB_TIMEOUT_MS, VERSION } from "../config.js";
import { now } from "../lib/common.js";
import { BridgeSettings, ExecutionJob, Project, TaskRecord } from "../types.js";
import { ApprovalEngine } from "../runtime/webagent/approval-engine.js";
import { LogStore } from "../runtime/log-store.js";
import { RuntimeStore } from "../runtime/runtime-store.js";
import { StateStore } from "../runtime/state-store.js";
import { AgentExecutor } from "./executor-contract.js";

export class CodexExecutor implements AgentExecutor {
  readonly descriptor = {
    id: "codex" as const,
    name: "Codex",
    description: "Native Codex executor for multi-file implementation, tests, and repair work.",
    capabilities: { canReadFiles: true, canWriteFiles: true, canRunShell: true, canUseMcp: true, canUseNetwork: false, canUseGit: true, canRunTests: true, canUseExternalModel: true },
    riskLevel: "high" as const,
    supportsCancel: true,
    supportsDryRun: true,
    supportsStreaming: true,
    supportsWorkspaceIsolation: true
  };

  constructor(
    private readonly runtimeStore: RuntimeStore,
    private readonly stateStore: StateStore,
    private readonly approvalEngine: ApprovalEngine,
    private readonly logStore: LogStore
  ) {}

  cancel(runId: string) {
    return { cancelled: false, reason: `Codex run ${runId} cancellation is recorded by Bridge. Live process interruption is not yet tracked across run ids.` };
  }

  buildPrompt(task: TaskRecord, project: Project, packetSummary: string, roles: string[], skills: string[]): string {
    const roleBlock = roles.length ? roles.map((role) => `- ${role}`).join("\n") : "- fullstack_engineer";
    const skillBlock = skills.length ? skills.map((skill) => `- ${skill}`).join("\n") : "- none";
    return [
      "You are Codex, the implementation executor behind the local bridge.",
      "ChatGPT Web already orchestrated the task. Do not redo discovery that the packet already covers.",
      "Use AGENTS.md and matching skills when relevant.",
      "Prefer the smallest safe diff and the smallest relevant verification step.",
      "",
      `Project: ${project.name}`,
      `Project path: ${project.path}`,
      `Task title: ${task.taskTitle}`,
      `Task goal: ${task.taskGoal}`,
      "",
      "Context summary:",
      packetSummary,
      "",
      "Referenced roles:",
      roleBlock,
      "",
      "Referenced skills:",
      skillBlock,
      "",
      "Return:",
      "1. changed_files",
      "2. diff_summary",
      "3. commands_run",
      "4. test_results",
      "5. risks_or_blockers",
      "6. recommended_next_step"
    ].join("\n");
  }

  private buildSandboxPolicy(project: Project, settings: BridgeSettings) {
    if (settings.codexSandboxMode === "readOnly") {
      return { type: "readOnly", access: { type: "restricted", includePlatformDefaults: true, readableRoots: [project.path] } };
    }
    if (settings.codexSandboxMode === "dangerFullAccess") {
      return { type: "dangerFullAccess" };
    }
    return {
      type: "workspaceWrite",
      writableRoots: [project.path],
      readOnlyAccess: { type: "restricted", includePlatformDefaults: true, readableRoots: [project.path] },
      networkAccess: settings.networkAccess
    };
  }

  private async runCli(job: ExecutionJob, project: Project): Promise<Partial<ExecutionJob>> {
    return new Promise((resolve) => {
      const child = spawn(CODEX_BIN, [...CODEX_ARGS, job.prompt || job.packet?.taskGoal || job.title], {
        cwd: project.path,
        env: process.env,
        shell: false
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => resolve({ stdout, stderr: stderr + `\n${error.message}`, exitCode: 1, result: "Codex CLI failed to start." }));
      child.on("close", (code) => resolve({ stdout, stderr, exitCode: code, result: stdout || stderr }));
    });
  }

  private async runAppServer(job: ExecutionJob, project: Project): Promise<Partial<ExecutionJob>> {
    const settings = this.approvalEngine.currentSettings();
    return new Promise((resolve) => {
      const child = spawn(CODEX_BIN, ["app-server"], {
        cwd: project.path,
        env: process.env,
        shell: false,
        stdio: ["pipe", "pipe", "pipe"]
      });
      const rl = readline.createInterface({ input: child.stdout });
      let stdout = "";
      let stderr = "";
      let agentText = "";
      let msgId = 1;
      const pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();
      let finished = false;

      const send = (message: unknown) => child.stdin.write(`${JSON.stringify(message)}\n`);
      const request = (method: string, params: Record<string, unknown>) => {
        const id = msgId++;
        send({ method, id, params });
        return new Promise<any>((resolveRequest, rejectRequest) => pending.set(id, { resolve: resolveRequest, reject: rejectRequest }));
      };
      const notify = (method: string, params: Record<string, unknown>) => send({ method, params });
      const finish = (payload: Partial<ExecutionJob>) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        try { child.stdin.end(); } catch {}
        try { child.kill(); } catch {}
        resolve(payload);
      };
      const timer = setTimeout(() => finish({ exitCode: 124, stdout, stderr, result: "Codex app-server timed out." }), CODEX_JOB_TIMEOUT_MS);

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => finish({ exitCode: 1, stdout, stderr: stderr + `\n${error.message}`, result: error.message }));
      child.on("close", (code) => {
        if (!finished) finish({ exitCode: code, stdout, stderr, result: agentText || stdout || stderr || `Codex app-server exited with ${code}` });
      });

      rl.on("line", (line) => {
        stdout += `${line}\n`;
        let message: any;
        try {
          message = JSON.parse(line);
        } catch {
          return;
        }
        if (typeof message.id === "number" && pending.has(message.id)) {
          const item = pending.get(message.id);
          pending.delete(message.id);
          if (message.error) item?.reject(new Error(message.error.message || JSON.stringify(message.error)));
          else item?.resolve(message.result);
          return;
        }
        if (message.method === "item/agentMessage/delta") {
          agentText += message.params?.delta || message.params?.text || "";
        }
        if (message.method === "turn/completed") {
          finish({ exitCode: 0, stdout, stderr, result: agentText || stdout || stderr || "Codex turn completed." });
        }
      });

      (async () => {
        try {
          await request("initialize", {
            clientInfo: { name: "chatgpt-web-first-bridge", title: "ChatGPT Web-first Bridge", version: VERSION },
            capabilities: { experimentalApi: true }
          });
          notify("initialized", {});
          const threadParams: Record<string, unknown> = {
            cwd: project.path,
            approvalPolicy: settings.codexApprovalPolicy,
            sandboxPolicy: this.buildSandboxPolicy(project, settings),
            personality: "neutral",
            serviceName: "chatgpt_web_first_bridge"
          };
          if (CODEX_APP_SERVER_MODEL) threadParams.model = CODEX_APP_SERVER_MODEL;
          const thread = await request("thread/start", threadParams);
          const turnParams: Record<string, unknown> = {
            threadId: thread?.thread?.id,
            cwd: project.path,
            input: [{ type: "text", text: job.prompt || job.title }],
            approvalPolicy: settings.codexApprovalPolicy,
            sandboxPolicy: this.buildSandboxPolicy(project, settings),
            summary: "concise"
          };
          if (CODEX_APP_SERVER_MODEL) turnParams.model = CODEX_APP_SERVER_MODEL;
          await request("turn/start", turnParams);
        } catch (error) {
          finish({ exitCode: 1, stdout, stderr, result: error instanceof Error ? error.message : String(error) });
        }
      })();
    });
  }

  async run(job: ExecutionJob, task: TaskRecord, project: Project): Promise<Partial<ExecutionJob>> {
    const runtime = this.runtimeStore.load();
    const settings = this.approvalEngine.currentSettings();
    if (job.requiresApproval && !job.approvedAt) {
      throw new Error("execution job requires approval before running");
    }
    if (runtime.execution === "dry-run") {
      const result = [
        "Dry-run only. Codex was not executed.",
        `Task: ${task.taskTitle}`,
        `Execution mode: ${runtime.execution}`,
        "Switch Dashboard > Advanced > execution mode to cli or app-server to use the real local Codex executor."
      ].join("\n");
      return { status: "completed", result, stdout: result, stderr: "", exitCode: 0 };
    }
    this.logStore.write({
      level: "info",
      source: "codex",
      action: "run_execution_job",
      message: "Codex execution started.",
      projectId: project.id,
      taskId: task.id,
      details: { executionMode: runtime.execution, sandbox: settings.codexSandboxMode, approvalPolicy: settings.codexApprovalPolicy }
    });
    return runtime.execution === "app-server"
      ? this.runAppServer(job, project)
      : this.runCli(job, project);
  }
}
