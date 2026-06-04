import fs from "node:fs";
import { spawn } from "node:child_process";

import { Project, WebPatch } from "../../types.js";
import { resolveProjectFile } from "../../project-files.js";

export class DiffManager {
  runGit(project: Pick<Project, "path">, args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
    return new Promise((resolve) => {
      const child = spawn("git", args, { cwd: project.path, env: process.env, shell: false });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => resolve({ stdout, stderr: stderr + `\n${error.message}`, exitCode: 1 }));
      child.on("close", (code) => resolve({ stdout, stderr, exitCode: code }));
    });
  }

  buildUnifiedDiff(filePath: string, before: string, after: string): string {
    if (before === after) {
      return `--- a/${filePath}\n+++ b/${filePath}\n(no changes)\n`;
    }
    const beforeLines = before.split("\n");
    const afterLines = after.split("\n");
    const max = Math.max(beforeLines.length, afterLines.length);
    const out = [`--- a/${filePath}`, `+++ b/${filePath}`, "@@ simplified-diff @@"];
    for (let index = 0; index < max; index += 1) {
      const a = beforeLines[index];
      const b = afterLines[index];
      if (a === b) {
        if (a !== undefined) {
          out.push(` ${a}`);
        }
      } else {
        if (a !== undefined) out.push(`-${a}`);
        if (b !== undefined) out.push(`+${b}`);
      }
    }
    return out.join("\n");
  }

  diffPatch(patch: WebPatch, project: Project): { patchId: string; status: string; files: Array<{ filePath: string; mode: string; diff: string }> } {
    const files = patch.changes.map((change) => {
      const target = resolveProjectFile(project, change.filePath);
      const current = fs.existsSync(target) && fs.statSync(target).isFile() ? fs.readFileSync(target, "utf8") : "";
      return {
        filePath: change.filePath,
        mode: change.mode,
        diff: this.buildUnifiedDiff(change.filePath, current, change.content)
      };
    });
    return {
      patchId: patch.id,
      status: patch.status,
      files
    };
  }
}
