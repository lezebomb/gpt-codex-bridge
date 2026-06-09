import fs from "node:fs";
import path from "node:path";

import { CONTEXT_PACKS_DIR, MAX_CONTEXT_FILES, ROLE_DIR } from "../../config.js";
import { ensureDir, now, summarizeText, uniqueStrings, writeJsonFile } from "../../lib/common.js";
import { ContextPackBudget, ContextPackRecord, Project, RetrievedContextRecord } from "../../types.js";
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

  async createContextPack(project: Project, options: { taskId?: string; goal?: string; paths?: string[]; includeTree?: boolean; includeGitStatus?: boolean; includeDiff?: boolean; explicitFullRead?: boolean; budget?: ContextPackBudget; retrievedContext?: Omit<RetrievedContextRecord, "id" | "createdAt" | "updatedAt"> | null }) {
    ensureDir(CONTEXT_PACKS_DIR);
    const budget = options.budget || "small";
    const budgetConfig = budget === "large"
      ? { treeEntries: 140, ruleItems: 8, skillItems: 8, roleItems: 8, summaryChars: 380, gitStatusChars: 3200, gitDiffChars: 20_000, maxFiles: 12, maxSnippets: 12, maxCharsPerSnippet: 460, maxTotalChars: 30_000 }
      : budget === "medium"
        ? { treeEntries: 80, ruleItems: 6, skillItems: 6, roleItems: 6, summaryChars: 260, gitStatusChars: 1800, gitDiffChars: 12_000, maxFiles: 8, maxSnippets: 8, maxCharsPerSnippet: 340, maxTotalChars: 18_000 }
        : { treeEntries: 0, ruleItems: 4, skillItems: 4, roleItems: 4, summaryChars: 180, gitStatusChars: 900, gitDiffChars: 6_000, maxFiles: 5, maxSnippets: 5, maxCharsPerSnippet: 260, maxTotalChars: 10_000 };
    const paths = uniqueStrings((options.paths || []).slice(0, MAX_CONTEXT_FILES));
    const files = paths.map((filePath) => readProjectFile(project, filePath));
    const instructions = this.instructionLoader.load(project.path, paths);
    const skills = this.skillLoader.list(project.path, [options.goal || "", paths.join(" ")]);
    const tree = options.includeTree === false || budgetConfig.treeEntries === 0
      ? []
      : walkFiles(project.path, "", budgetConfig.treeEntries + 1);
    const gitStatus = options.includeGitStatus === false ? null : await this.diffManager.runGit(project, ["status", "--short", "--branch"]);
    const gitDiff = options.includeDiff ? await this.diffManager.runGit(project, ["diff", "--"]) : null;
    const packageJsonPath = path.join(project.path, "package.json");
    const packageJson = fs.existsSync(packageJsonPath) ? JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) : null;
    const readmePreview = findReadmePreview(project.path);
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
    lines.push(`Budget: ${budget}`);
    lines.push("");
    if (packageJson || readmePreview) {
      lines.push("## Project Summary");
      if (packageJson) {
        lines.push(`- package.json: ${summarizeText(JSON.stringify({ name: packageJson.name, version: packageJson.version, scripts: Object.keys(packageJson.scripts || {}) }, null, 2), budgetConfig.summaryChars)}`);
      }
      if (readmePreview) {
        lines.push(`- README: ${summarizeText(readmePreview, budgetConfig.summaryChars)}`);
      }
      lines.push("");
    }
    if (tree.length) {
      lines.push("## Directory Summary");
      lines.push("```text");
      const visibleTree = tree.slice(0, budgetConfig.treeEntries);
      lines.push(...visibleTree.map((entry) => `${entry.type === "dir" ? "[d]" : "[f]"} ${entry.path}${entry.size ? ` (${entry.size}b)` : ""}`));
      lines.push("```");
      if (tree.length > budgetConfig.treeEntries) {
        lines.push(`Tree truncated: showing ${budgetConfig.treeEntries} entries for the ${budget} budget.`);
      }
      lines.push("");
    }
    if (gitStatus) {
      lines.push("## Git Status");
      lines.push("```text");
      lines.push((gitStatus.stdout || gitStatus.stderr || "").slice(0, budgetConfig.gitStatusChars));
      lines.push("```");
      lines.push("");
    }
    if (gitDiff) {
      lines.push("## Git Diff Preview");
      lines.push("```diff");
      lines.push((gitDiff.stdout || gitDiff.stderr || "").slice(0, budgetConfig.gitDiffChars));
      lines.push("```");
      lines.push("");
    }
    if (instructions.length) {
      lines.push("## Rule Summaries");
      for (const instruction of instructions.slice(0, budgetConfig.ruleItems)) {
        lines.push(`- [${instruction.scope}] ${instruction.path}: ${summarizeText(instruction.preview || "", budgetConfig.summaryChars)}`);
      }
      if (instructions.length > budgetConfig.ruleItems) {
        lines.push(`- Additional rule files omitted for the ${budget} budget.`);
      }
      lines.push("");
    }
    if (skills.length) {
      lines.push("## Skill Summaries");
      for (const skill of skills.slice(0, budgetConfig.skillItems)) {
        lines.push(`- ${skill.id}: ${skill.description || skill.name}`);
      }
      if (skills.length > budgetConfig.skillItems) {
        lines.push(`- Additional matched skills omitted for the ${budget} budget.`);
      }
      lines.push("");
    }
    if (roles.length) {
      lines.push("## Role Protocols");
      for (const role of roles.slice(0, budgetConfig.roleItems)) {
        lines.push(`- ${role}`);
      }
      if (roles.length > budgetConfig.roleItems) {
        lines.push(`- Additional role files omitted for the ${budget} budget.`);
      }
      lines.push("");
    }
    if (options.retrievedContext && !options.explicitFullRead) {
      lines.push("## Retrieved Context");
      lines.push("This section is the default context source. Full file excerpts are omitted unless explicitFullRead=true.");
      lines.push(`Provider: ${options.retrievedContext.provider}`);
      lines.push(`Summary: ${options.retrievedContext.conciseSummary}`);
      if (options.retrievedContext.retrievalWarnings.length) {
        lines.push(`Warnings: ${options.retrievedContext.retrievalWarnings.join(" | ")}`);
      }
      lines.push(`EstimatedTokenBudget: ${options.retrievedContext.estimatedTokenBudget}`);
      lines.push("");
      for (const item of options.retrievedContext.relevantFileDetails) {
        lines.push(`### ${item.path}`);
        lines.push(`Reason: ${item.reason}`);
        lines.push(`Summary: ${summarizeText(item.summary, budgetConfig.summaryChars)}`);
        if (item.exportedSymbols.length) {
          lines.push(`Symbols: ${item.exportedSymbols.join(", ")}`);
        }
        lines.push("```text");
        lines.push(item.snippets.map((snippet) => summarizeText(snippet, budgetConfig.summaryChars + 80)).join("\n\n"));
        lines.push("```");
        lines.push(item.suggestedNextRead);
        lines.push("");
      }
    }
    if (files.length && (!options.retrievedContext || options.explicitFullRead)) {
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
        budget,
        files: options.retrievedContext && !options.explicitFullRead ? (options.retrievedContext.relevantFiles.length || 0) : files.length,
        snippetFiles: options.retrievedContext?.relevantFileDetails.length || 0,
        truncatedFiles: options.explicitFullRead ? 0 : files.filter((file) => file.content.length > 12_000).length,
        treeEntries: Math.min(tree.length, budgetConfig.treeEntries),
        maxFiles: budgetConfig.maxFiles,
        maxSnippets: budgetConfig.maxSnippets,
        maxCharsPerSnippet: budgetConfig.maxCharsPerSnippet,
        maxTotalChars: budgetConfig.maxTotalChars,
        includeFullFiles: Boolean(options.explicitFullRead),
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
