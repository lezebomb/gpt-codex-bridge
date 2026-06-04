import fs from "node:fs";
import path from "node:path";

import { GLOBAL_HOME_SKILL_DIR, LOCAL_SKILL_DIR } from "../../config.js";
import { filePreview } from "../../lib/common.js";

export type SkillSummary = {
  id: string;
  path: string;
  source: "project" | "user" | "global";
  name: string;
  description: string;
  body?: string;
};

function parseFrontmatter(content: string): { name: string; description: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  const block = match?.[1] || "";
  const name = block.match(/^name:\s*(.+)$/m)?.[1]?.trim() || "";
  const description = block.match(/^description:\s*(.+)$/m)?.[1]?.trim() || "";
  return { name, description };
}

export class SkillLoader {
  private directories(projectPath: string): Array<{ path: string; source: SkillSummary["source"] }> {
    const dirs: Array<{ path: string; source: SkillSummary["source"] }> = [
      { path: path.join(projectPath, ".agents", "skills"), source: "project" },
      { path: LOCAL_SKILL_DIR, source: "global" },
      { path: GLOBAL_HOME_SKILL_DIR, source: "user" }
    ];
    const configured = (process.env.BRIDGE_GLOBAL_SKILLS || "")
      .split(path.delimiter)
      .map((entry) => entry.trim())
      .filter(Boolean);
    for (const dir of configured) {
      dirs.push({ path: dir, source: "global" });
    }
    return dirs;
  }

  list(projectPath: string, hints: string[] = []): SkillSummary[] {
    const results: SkillSummary[] = [];
    const tokens = hints.join(" ").toLowerCase().split(/\s+/).filter(Boolean);
    for (const directory of this.directories(projectPath)) {
      if (!fs.existsSync(directory.path)) {
        continue;
      }
      for (const entry of fs.readdirSync(directory.path, { withFileTypes: true })) {
        if (!entry.isDirectory()) {
          continue;
        }
        const skillMd = path.join(directory.path, entry.name, "SKILL.md");
        if (!fs.existsSync(skillMd)) {
          continue;
        }
        const preview = filePreview(skillMd, 2400) || "";
        const meta = parseFrontmatter(preview);
        const summary: SkillSummary = {
          id: entry.name,
          path: skillMd,
          source: directory.source,
          name: meta.name || entry.name,
          description: meta.description || ""
        };
        if (tokens.length && tokens.some((token) => summary.id.toLowerCase().includes(token) || summary.name.toLowerCase().includes(token) || summary.description.toLowerCase().includes(token))) {
          summary.body = fs.readFileSync(skillMd, "utf8");
        }
        results.push(summary);
      }
    }
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }
}
