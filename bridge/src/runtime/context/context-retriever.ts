import fs from "node:fs";
import path from "node:path";

import { MAX_CONTEXT_RETRIEVE_FILES, MAX_CONTEXT_RETRIEVE_SNIPPETS } from "../../config.js";
import { clamp, summarizeText, truncateText } from "../../lib/common.js";
import { Project, RetrievedContextFileDetail, RetrievedContextRecord, RetrievedContextSnippet } from "../../types.js";
import { SkillLoader } from "../webagent/skill-loader.js";
import { InstructionLoader } from "../webagent/instruction-loader.js";
import { ProjectIndexer } from "./project-indexer.js";
import { FtsIndex } from "./fts-index.js";

function buildSnippet(content: string, query: string): string {
  const lower = content.toLowerCase();
  const index = lower.indexOf(query.toLowerCase());
  if (index === -1) return truncateText(content, 220);
  const start = Math.max(0, index - 80);
  const end = Math.min(content.length, index + query.length + 140);
  return truncateText(content.slice(start, end).trim(), 240);
}

function detectSymbols(filePath: string, content: string): string[] {
  const symbols = new Set<string>();
  for (const match of content.matchAll(/export\s+(?:async\s+)?(?:function|class|const|let)\s+([A-Za-z0-9_]+)/g)) {
    symbols.add(match[1]);
  }
  if (/\.(tsx|jsx)$/.test(filePath)) {
    for (const match of content.matchAll(/function\s+([A-Z][A-Za-z0-9_]*)\s*\(/g)) {
      symbols.add(match[1]);
    }
  }
  return Array.from(symbols).slice(0, 8);
}

export class ContextRetriever {
  constructor(
    private readonly projectIndexer: ProjectIndexer,
    private readonly instructionLoader: InstructionLoader,
    private readonly skillLoader: SkillLoader
  ) {}

  retrieve(project: Project, input: { query: string; purpose?: string; maxFiles?: number; maxSnippets?: number; includeRules?: boolean; includeSkills?: boolean }): Omit<RetrievedContextRecord, "id" | "createdAt" | "updatedAt"> {
    const indexPaths = this.projectIndexer.paths(project.id);
    const status = this.projectIndexer.getStatus(project.id);
    if (status.status !== "ready" || !fs.existsSync(indexPaths.sqlitePath)) {
      this.projectIndexer.indexProject(project, status.status === "stale");
    }
    const search = new FtsIndex(indexPaths.sqlitePath).search(input.query, clamp(input.maxFiles || MAX_CONTEXT_RETRIEVE_FILES, 1, MAX_CONTEXT_RETRIEVE_FILES));
    const relevantFiles = search.results.map((item) => item.path);
    const snippets: RetrievedContextSnippet[] = [];
    const relevantFileDetails: RetrievedContextFileDetail[] = [];
    for (const result of search.results.slice(0, clamp(input.maxSnippets || MAX_CONTEXT_RETRIEVE_SNIPPETS, 1, MAX_CONTEXT_RETRIEVE_SNIPPETS))) {
      const absolutePath = path.join(project.path, result.path);
      if (!fs.existsSync(absolutePath)) continue;
      const content = fs.readFileSync(absolutePath, "utf8");
      const snippet = buildSnippet(content, input.query);
      snippets.push({
        filePath: result.path,
        text: snippet,
        reason: result.summary,
        score: result.score
      });
      relevantFileDetails.push({
        path: result.path,
        reason: result.summary,
        summary: summarizeText(content, 240),
        snippets: [snippet],
        exportedSymbols: detectSymbols(result.path, content),
        suggestedNextRead: `Use read_file on ${result.path} if you need exact implementation details.`
      });
    }
    const rulesSummary = input.includeRules === false
      ? []
      : this.instructionLoader.load(project.path, relevantFiles).slice(0, 8).map((item) => `${path.basename(item.path)}: ${summarizeText(item.preview || "", 160)}`);
    const matchedSkills = input.includeSkills === false
      ? []
      : this.skillLoader.list(project.path, [input.query, input.purpose || ""]).slice(0, 6).map((skill) => `${skill.id}: ${skill.description || skill.name}`);
    const conciseSummary = search.results.length
      ? `Found ${search.results.length} relevant context matches for "${input.query}" in ${project.name}.`
      : `No strong indexed matches for "${input.query}" in ${project.name}.`;
    return {
      projectId: project.id,
      taskId: undefined,
      taskBranchId: undefined,
      query: input.query,
      purpose: input.purpose,
      conciseSummary,
      relevantFiles,
      relevantFileDetails,
      snippets,
      rulesSummary,
      matchedSkills,
      suggestedNextReads: relevantFileDetails.map((item) => item.path).slice(0, 5),
      estimatedTokenBudget: 260 + relevantFileDetails.reduce((total, item) => total + Math.ceil((item.summary.length + item.snippets.join(" ").length) / 4), 0),
      retrievalWarnings: search.warning ? [search.warning] : [],
      provider: search.provider
    };
  }
}
