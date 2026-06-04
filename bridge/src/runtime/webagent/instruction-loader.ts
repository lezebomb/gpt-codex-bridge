import fs from "node:fs";
import path from "node:path";

import { GLOBAL_RULE_CANDIDATES } from "../../config.js";
import { filePreview } from "../../lib/common.js";
import { assertSafeRelativePath } from "../../project-files.js";

export type InstructionSummary = {
  id: string;
  path: string;
  scope: "target" | "project" | "user";
  priority: number;
  preview: string | null;
};

export class InstructionLoader {
  private findRuleFiles(dirPath: string): string[] {
    const matches: string[] = [];
    for (const fileName of GLOBAL_RULE_CANDIDATES) {
      const candidate = path.join(dirPath, fileName);
      if (fs.existsSync(candidate)) {
        matches.push(candidate);
      }
    }
    const cursorRulesDir = path.join(dirPath, ".cursor", "rules");
    if (fs.existsSync(cursorRulesDir) && fs.statSync(cursorRulesDir).isDirectory()) {
      for (const fileName of fs.readdirSync(cursorRulesDir)) {
        const candidate = path.join(cursorRulesDir, fileName);
        if (fs.statSync(candidate).isFile()) {
          matches.push(candidate);
        }
      }
    }
    return matches;
  }

  load(projectPath: string, targetFiles: string[] = []): InstructionSummary[] {
    const seen = new Set<string>();
    const results: InstructionSummary[] = [];

    const pushFile = (filePath: string, scope: InstructionSummary["scope"], priority: number) => {
      const normalized = path.resolve(filePath);
      if (seen.has(normalized) || !fs.existsSync(normalized)) {
        return;
      }
      seen.add(normalized);
      results.push({
        id: path.basename(normalized),
        path: normalized,
        scope,
        priority,
        preview: filePreview(normalized, 1600)
      });
    };

    for (const target of targetFiles) {
      const safeTarget = assertSafeRelativePath(target);
      let cursor = path.dirname(path.join(projectPath, safeTarget));
      let depth = 0;
      while (cursor.startsWith(projectPath)) {
        for (const candidate of this.findRuleFiles(cursor)) {
          pushFile(candidate, depth === 0 ? "target" : "project", depth);
        }
        const next = path.dirname(cursor);
        if (next === cursor) {
          break;
        }
        cursor = next;
        depth += 1;
      }
    }

    for (const candidate of this.findRuleFiles(projectPath)) {
      pushFile(candidate, "project", 20);
    }

    const home = process.env.USERPROFILE || process.env.HOME || projectPath;
    for (const candidate of this.findRuleFiles(home)) {
      pushFile(candidate, "user", 40);
    }

    return results.sort((a, b) => a.priority - b.priority || a.path.localeCompare(b.path));
  }
}
