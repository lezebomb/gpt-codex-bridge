import { spawn } from "node:child_process";
import path from "node:path";

import { nanoid } from "nanoid";

import { compactForLog, now } from "../../lib/common.js";
import { Project, ShellCommandRecord } from "../../types.js";
import { LogStore } from "../log-store.js";
import { StateStore } from "../state-store.js";
import { ApprovalEngine } from "./approval-engine.js";

const DANGEROUS_COMMAND = /\b(rm|del|erase|format|shutdown|restart-computer|remove-item|rmdir|rd|git\s+reset\s+--hard|git\s+clean\s+-fd|reg\s+delete)\b/i;
const READ_ONLY_PREFIX = /^(git\s+(status|diff|log)|dir\b|ls\b|pwd\b|type\b|cat\b|Get-Content\b|rg\b|where\b)/i;

export class ShellRunner {
  constructor(
    private readonly stateStore: StateStore,
    private readonly approvalEngine: ApprovalEngine,
    private readonly logStore: LogStore
  ) {}

  private classify(command: string): ShellCommandRecord["classification"] {
    if (DANGEROUS_COMMAND.test(command)) {
      return "dangerous";
    }
    if (READ_ONLY_PREFIX.test(command.trim())) {
      return "read_only";
    }
    return "project_write";
  }

  list(): ShellCommandRecord[] {
    return this.stateStore.load().shellCommands.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(commandId: string): ShellCommandRecord {
    const record = this.stateStore.load().shellCommands.find((item) => item.id === commandId);
    if (!record) {
      throw new Error("shell command not found");
    }
    return record;
  }

  create(project: Project, input: { taskId?: string; command: string; cwd?: string; timeoutMs?: number; shell?: "powershell" | "cmd" | "bash" }, requestId?: string): ShellCommandRecord {
    const cwd = input.cwd ? path.resolve(project.path, input.cwd) : project.path;
    if (cwd !== project.path && !cwd.startsWith(project.path + path.sep)) {
      throw new Error("cwd escapes project root");
    }
    const record: ShellCommandRecord = {
      id: nanoid(10),
      projectId: project.id,
      taskId: input.taskId,
      command: input.command,
      cwd,
      timeoutMs: Math.max(1000, Math.min(10 * 60 * 1000, Number(input.timeoutMs || 60_000))),
      shell: input.shell || "powershell",
      classification: this.classify(input.command),
      status: "needs_approval",
      requiresApproval: true,
      events: [{ at: now(), type: "command_created", message: "Shell command queued for approval.", data: compactForLog(input) }],
      createdAt: now(),
      updatedAt: now()
    };
    record.requiresApproval = this.approvalEngine.needsApprovalForShell(record);
    record.status = record.requiresApproval ? "needs_approval" : "queued";
    this.stateStore.update((state) => {
      state.shellCommands.push(record);
    });
    this.logStore.write({
      level: record.classification === "dangerous" ? "warn" : "info",
      source: "mcp",
      action: "run_shell_command",
      message: record.requiresApproval ? "Shell command created and waiting for approval." : "Shell command created.",
      requestId,
      projectId: project.id,
      taskId: input.taskId,
      details: { commandId: record.id, command: input.command, classification: record.classification }
    });
    return record;
  }

  async run(commandId: string, requestId?: string): Promise<ShellCommandRecord> {
    const record = this.get(commandId);
    if (record.classification === "dangerous") {
      throw new Error("dangerous shell commands cannot be executed silently");
    }
    if (record.requiresApproval && !record.approvedAt) {
      throw new Error("shell command requires approval before execution");
    }
    this.stateStore.update((state) => {
      const current = state.shellCommands.find((item) => item.id === commandId);
      if (!current) throw new Error("shell command not found");
      current.status = "running";
      current.updatedAt = now();
      current.events.push({ at: now(), type: "command_started", message: "Shell command started." });
    });

    const result = await new Promise<{ stdout: string; stderr: string; exitCode: number | null }>((resolve) => {
      const shellArgs = record.shell === "cmd"
        ? ["cmd.exe", "/c", record.command]
        : record.shell === "bash"
          ? ["bash", "-lc", record.command]
          : ["powershell", "-NoProfile", "-Command", record.command];
      const child = spawn(shellArgs[0], shellArgs.slice(1), { cwd: record.cwd, env: process.env, shell: false });
      let stdout = "";
      let stderr = "";
      const timer = setTimeout(() => {
        try {
          child.kill();
        } catch {
          // Ignore.
        }
      }, record.timeoutMs);
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => {
        clearTimeout(timer);
        resolve({ stdout, stderr: stderr + `\n${error.message}`, exitCode: 1 });
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        resolve({ stdout, stderr, exitCode: code });
      });
    });

    return this.stateStore.update((state) => {
      const current = state.shellCommands.find((item) => item.id === commandId);
      if (!current) throw new Error("shell command not found");
      current.stdout = result.stdout;
      current.stderr = result.stderr;
      current.exitCode = result.exitCode;
      current.status = result.exitCode === 0 ? "completed" : "failed";
      current.updatedAt = now();
      current.events.push({ at: now(), type: "command_finished", message: `Shell exited with ${result.exitCode}` });
      this.logStore.write({
        level: result.exitCode === 0 ? "info" : "error",
        source: "shell",
        action: "run_shell_command",
        message: result.exitCode === 0 ? "Shell command completed." : "Shell command failed.",
        requestId,
        projectId: current.projectId,
        taskId: current.taskId,
        details: { commandId: current.id, exitCode: result.exitCode }
      });
      return current;
    });
  }

  approve(commandId: string): ShellCommandRecord {
    return this.stateStore.update((state) => {
      const record = state.shellCommands.find((item) => item.id === commandId);
      if (!record) throw new Error("shell command not found");
      if (record.classification === "dangerous") throw new Error("dangerous shell commands stay blocked");
      record.approvedAt = now();
      record.status = "queued";
      record.updatedAt = now();
      record.events.push({ at: now(), type: "command_approved", message: "Shell command approved by user." });
      return record;
    });
  }
}
