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

function detectSymbolPack(filePath: string, content: string) {
  const exportedSymbols = new Set<string>();
  const functions = new Set<string>();
  const classes = new Set<string>();
  const imports = new Set<string>();
  const detectedComponents = new Set<string>();
  const routes = new Set<string>();
  for (const match of content.matchAll(/export\s+(?:async\s+)?(?:function|class|const|let)\s+([A-Za-z0-9_]+)/g)) {
    exportedSymbols.add(match[1]);
  }
  for (const match of content.matchAll(/(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/g)) {
    functions.add(match[1]);
  }
  for (const match of content.matchAll(/(?:const|let)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g)) {
    functions.add(match[1]);
  }
  for (const match of content.matchAll(/class\s+([A-Za-z0-9_]+)/g)) {
    classes.add(match[1]);
  }
  for (const match of content.matchAll(/^\s*import\s+(?:type\s+)?(.+?)\s+from\s+["']([^"']+)["']/gm)) {
    imports.add(`${match[1].replace(/\s+/g, " ").slice(0, 80)} from ${match[2]}`);
  }
  for (const match of content.matchAll(/^\s*from\s+([\w.]+)\s+import\s+(.+)$/gm)) {
    imports.add(`${match[2].trim().slice(0, 80)} from ${match[1]}`);
  }
  if (/\.(tsx|jsx)$/.test(filePath)) {
    for (const match of content.matchAll(/(?:function|const)\s+([A-Z][A-Za-z0-9_]*)\b/g)) detectedComponents.add(match[1]);
    for (const match of content.matchAll(/<Route\b[^>]*(?:path|to)=["']([^"']+)["']/g)) routes.add(match[1]);
  }
  if (/\.(py)$/.test(filePath)) {
    for (const match of content.matchAll(/^\s*def\s+([A-Za-z0-9_]+)\s*\(/gm)) functions.add(match[1]);
    for (const match of content.matchAll(/^\s*class\s+([A-Za-z0-9_]+)/gm)) classes.add(match[1]);
    for (const match of content.matchAll(/@(app|router)\.(get|post|put|delete|patch)\(["']([^"']+)["']/g)) routes.add(`${match[2].toUpperCase()} ${match[3]}`);
  }
  if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath) || /(^|[\\/])tests?[\\/]/.test(filePath)) {
    routes.add("test-file");
  }
  return {
    exportedSymbols: Array.from(exportedSymbols).slice(0, 12),
    detectedComponents: Array.from(detectedComponents).slice(0, 12),
    functions: Array.from(functions).slice(0, 16),
    classes: Array.from(classes).slice(0, 12),
    imports: Array.from(imports).slice(0, 16),
    routes: Array.from(routes).slice(0, 12),
    testFiles: /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath) || /(^|[\\/])tests?[\\/]/.test(filePath) ? [filePath] : [],
    relatedFiles: [] as string[]
  };
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
      const symbolPack = detectSymbolPack(result.path, content);
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
        exportedSymbols: symbolPack.exportedSymbols,
        detectedComponents: symbolPack.detectedComponents,
        functions: symbolPack.functions,
        classes: symbolPack.classes,
        imports: symbolPack.imports,
        routes: symbolPack.routes,
        testFiles: symbolPack.testFiles,
        relatedFiles: symbolPack.relatedFiles,
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
