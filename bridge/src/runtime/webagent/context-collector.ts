import fs from "node:fs";
import path from "node:path";

import { CONTEXT_PACKS_DIR, MAX_CONTEXT_FILES, ROLE_DIR } from "../../config.js";
import { ensureDir, filePreview, now, uniqueStrings, writeJsonFile } from "../../lib/common.js";
import { ContextPackRecord, Project } from "../../types.js";
import { findReadmePreview, inferTechStack, readProjectFile, walkFiles } from "../../project-files.js";
import { formatContextPackFile } from "../context/context-pack-builder.js";
import { DiffManager } from "./diff-manager.js";
import { InstructionLoader } from "./instruction-loader.js";
import { SkillLoader } from "./skill-loader.js";

export class ContextCollector {
  constructor(
    private readonly diffManager: DiffManager,
    private readonly instructionLoader: InstructionLoader,
    private readonly skillLoader: SkillLoader
  ) {}

  inspectProject(project: Project) {
    const packageJsonPath = path.join(project.path, "package.json");
    const packageJson = fs.existsSync(packageJsonPath) ? JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) : null;
    const readmePreview = findReadmePreview(project.path);
    const instructions = this.instructionLoader.load(project.path);
    return this.diffManager.runGit(project, ["status", "--short", "--branch"]).then((gitStatus) => ({
      project,
      tree: walkFiles(project.path, "", 200),
      packageJson,
      readmePreview,
      gitStatus,
      instructions,
      techStack: inferTechStack(project.path)
    }));
  }

  async createContextPack(project: Project, options: { taskId?: string; goal?: string; paths?: string[]; includeTree?: boolean; includeGitStatus?: boolean; includeDiff?: boolean; explicitFullRead?: boolean }) {
    ensureDir(CONTEXT_PACKS_DIR);
    const paths = uniqueStrings((options.paths || []).slice(0, MAX_CONTEXT_FILES));
    const files = paths.map((filePath) => readProjectFile(project, filePath));
    const instructions = this.instructionLoader.load(project.path, paths);
    const skills = this.skillLoader.list(project.path, [options.goal || "", paths.join(" ")]);
    const tree = options.includeTree === false ? [] : walkFiles(project.path, "", 250);
    const gitStatus = options.includeGitStatus === false ? null : await this.diffManager.runGit(project, ["status", "--short", "--branch"]);
    const gitDiff = options.includeDiff ? await this.diffManager.runGit(project, ["diff", "--"]) : null;
    const roles = fs.existsSync(ROLE_DIR)
      ? fs.readdirSync(ROLE_DIR).filter((name) => name.endsWith(".md")).sort()
      : [];
    const packId = Math.random().toString(36).slice(2, 12);
    const lines: string[] = [];
    lines.push(`# Context Pack ${packId}`);
    lines.push("");
    lines.push(`Project: ${project.name}`);
    lines.push(`Path: ${project.path}`);
    if (options.goal) lines.push(`Goal: ${options.goal}`);
    lines.push(`GeneratedAt: ${now()}`);
    lines.push("");
    if (tree.length) {
      lines.push("## Directory Summary");
      lines.push("```text");
      lines.push(...tree.map((entry) => `${entry.type === "dir" ? "[d]" : "[f]"} ${entry.path}${entry.size ? ` (${entry.size}b)` : ""}`));
      lines.push("```");
      lines.push("");
    }
    if (gitStatus) {
      lines.push("## Git Status");
      lines.push("```text");
      lines.push(gitStatus.stdout || gitStatus.stderr || "");
      lines.push("```");
      lines.push("");
    }
    if (gitDiff) {
      lines.push("## Git Diff Preview");
      lines.push("```diff");
      lines.push((gitDiff.stdout || gitDiff.stderr || "").slice(0, 20_000));
      lines.push("```");
      lines.push("");
    }
    if (instructions.length) {
      lines.push("## Rule Files");
      for (const instruction of instructions) {
        lines.push(`- [${instruction.scope}] ${instruction.path}`);
      }
      lines.push("");
    }
    if (skills.length) {
      lines.push("## Skill Summaries");
      for (const skill of skills.slice(0, 20)) {
        lines.push(`- ${skill.id}: ${skill.description || skill.name}`);
      }
      lines.push("");
    }
    if (roles.length) {
      lines.push("## Role Protocols");
      for (const role of roles) {
        lines.push(`- ${role}`);
      }
      lines.push("");
    }
    if (files.length) {
      lines.push("## Relevant Files");
      for (const file of files) {
        const formatted = formatContextPackFile({ filePath: file.path, content: file.content, explicitFullRead: options.explicitFullRead });
        lines.push(`### ${file.path}`);
        if (formatted.mode === "inline") {
          lines.push("```text");
          lines.push(formatted.content);
          lines.push("```");
        } else {
          lines.push(`Summary: ${formatted.summary}`);
          lines.push("```text");
          lines.push(formatted.snippet);
          lines.push("```");
          lines.push(formatted.suggestedReadRange);
        }
        lines.push("");
      }
    }
    const markdown = lines.join("\n");
    const filePath = path.join(CONTEXT_PACKS_DIR, `${packId}.md`);
    fs.writeFileSync(filePath, markdown, "utf8");
    const record: ContextPackRecord = {
      id: packId,
      projectId: project.id,
      taskId: options.taskId,
      goal: options.goal,
      filePath,
      summary: {
        files: files.length,
        treeEntries: tree.length,
        includesGitStatus: Boolean(gitStatus),
        includesDiff: Boolean(gitDiff),
        ruleFiles: instructions.length,
        skills: skills.length
      },
      createdAt: now(),
      updatedAt: now()
    };
    writeJsonFile(`${filePath}.meta.json`, record);
    return { record, markdown };
  }
}
