import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { now } from "../../lib/common.js";
import { IsolationMode, Project, TaskBranchRecord, WorktreeStatus } from "../../types.js";

function safeName(value: string): string {
  return value.replace(/[^A-Za-z0-9_.-]+/g, "-").slice(0, 48) || "task-branch";
}

export class TaskWorktreeManager {
  isGitRepo(projectPath: string): boolean {
    const result = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: projectPath, encoding: "utf8", env: process.env });
    return result.status === 0 && String(result.stdout || "").trim() === "true";
  }

  recommend(input: { executorMode: TaskBranchRecord["executorMode"]; touchedFiles: string[]; isGitRepo: boolean; riskHint?: "low" | "medium" | "high" }) {
    if (!input.isGitRepo) {
      return {
        isolationMode: input.riskHint === "high" ? "copy_workspace" as IsolationMode : "in_place" as IsolationMode,
        reason: "Project is not a Git repo, so git_worktree is unavailable.",
        riskNotes: ["copy_workspace is available as a heavier fallback; in_place relies on patch preflight and backups."]
      };
    }
    if (input.executorMode === "codex" || input.executorMode === "external" || input.executorMode === "hybrid" || input.touchedFiles.length > 3 || input.riskHint === "high") {
      return {
        isolationMode: "git_worktree" as IsolationMode,
        reason: "Higher-risk executor or broad file set benefits from a separate Git worktree.",
        riskNotes: ["Worktree is optional and not created by default."]
      };
    }
    return {
      isolationMode: "in_place" as IsolationMode,
      reason: "Focused WebAgent work can stay in_place with patch preflight and backups.",
      riskNotes: ["Use git_worktree for dependency installs, broad refactors, or external executors."]
    };
  }

  createWorkspace(project: Project, branch: TaskBranchRecord, requestedMode?: IsolationMode) {
    const isGitRepo = this.isGitRepo(project.path);
    const recommendation = this.recommend({ executorMode: branch.executorMode, touchedFiles: branch.touchedFiles, isGitRepo, riskHint: "high" });
    const isolationMode = requestedMode || recommendation.isolationMode;
    const workspaceRoot = path.join(os.tmpdir(), "gpt-codex-bridge-worktrees");
    fs.mkdirSync(workspaceRoot, { recursive: true });
    const workspacePath = path.join(workspaceRoot, `${safeName(project.name)}-${safeName(branch.id)}`);

    if (isolationMode === "in_place") {
      return { isolationMode, workspacePath: project.path, worktreeStatus: "ready" as WorktreeStatus, createdAt: now(), message: "Using project root in_place." };
    }

    if (isolationMode === "git_worktree" && isGitRepo) {
      const gitBranchName = branch.gitBranchName || `codex/${safeName(branch.branchName)}-${branch.id}`;
      const args = ["worktree", "add", "-B", gitBranchName, workspacePath, "HEAD"];
      const result = spawnSync("git", args, { cwd: project.path, encoding: "utf8", env: process.env });
      if (result.status === 0) {
        return { isolationMode, workspacePath, gitBranchName, worktreeStatus: "ready" as WorktreeStatus, createdAt: now(), message: "Git worktree created." };
      }
      return { isolationMode: "copy_workspace" as IsolationMode, workspacePath, worktreeStatus: "failed" as WorktreeStatus, createdAt: now(), message: String(result.stderr || result.stdout || "git worktree failed") };
    }

    fs.cpSync(project.path, workspacePath, { recursive: true, force: true, filter: (source) => !source.split(path.sep).includes(".git") && !source.split(path.sep).includes("node_modules") });
    return { isolationMode: "copy_workspace" as IsolationMode, workspacePath, worktreeStatus: "ready" as WorktreeStatus, createdAt: now(), message: "Workspace copied without .git and node_modules." };
  }

  status(project: Project, branch: TaskBranchRecord) {
    const workspacePath = branch.workspacePath || project.path;
    return {
      isolationMode: branch.isolationMode,
      workspacePath,
      worktreeStatus: branch.worktreeStatus,
      exists: fs.existsSync(workspacePath),
      gitBranchName: branch.gitBranchName,
      worktreeCreatedAt: branch.worktreeCreatedAt
    };
  }

  cleanup(project: Project, branch: TaskBranchRecord) {
    if (!branch.workspacePath || branch.workspacePath === project.path) {
      return { cleaned: false, message: "No isolated workspace is attached to this Task Branch." };
    }
    const resolved = path.resolve(branch.workspacePath);
    const allowedRoot = path.resolve(path.join(os.tmpdir(), "gpt-codex-bridge-worktrees"));
    if (resolved !== allowedRoot && !resolved.startsWith(allowedRoot + path.sep)) {
      throw new Error("workspace path is outside the bridge worktree temp root; cleanup refused");
    }
    if (branch.isolationMode === "git_worktree" && this.isGitRepo(project.path)) {
      const result = spawnSync("git", ["worktree", "remove", "--force", resolved], { cwd: project.path, encoding: "utf8", env: process.env });
      if (result.status !== 0 && fs.existsSync(resolved)) {
        throw new Error(String(result.stderr || result.stdout || "git worktree remove failed"));
      }
    } else if (fs.existsSync(resolved)) {
      fs.rmSync(resolved, { recursive: true, force: true });
    }
    return { cleaned: true, message: "Isolated workspace cleaned up." };
  }
}

