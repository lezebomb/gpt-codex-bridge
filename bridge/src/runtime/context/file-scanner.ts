import fs from "node:fs";
import path from "node:path";

import { IGNORED_DIRS } from "../../config.js";

export type ScannedFile = {
  path: string;
  absolutePath: string;
  size: number;
  mtimeMs: number;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toPatternMatcher(pattern: string): (relativePath: string, isDirectory: boolean) => boolean {
  const normalized = pattern.replace(/\\/g, "/").replace(/^\/+/, "").trim();
  if (!normalized) {
    return () => false;
  }
  if (!normalized.includes("*")) {
    if (normalized.endsWith("/")) {
      const dirPattern = normalized.replace(/\/+$/, "");
      return (relativePath, isDirectory) => isDirectory && (relativePath === dirPattern || relativePath.startsWith(`${dirPattern}/`));
    }
    return (relativePath) => relativePath === normalized || relativePath.endsWith(`/${normalized}`);
  }
  const regex = new RegExp(`(^|/)${escapeRegExp(normalized).replace(/\\\*/g, ".*")}$`);
  return (relativePath) => regex.test(relativePath);
}

function loadIgnoreMatchers(projectPath: string): Array<(relativePath: string, isDirectory: boolean) => boolean> {
  const gitignorePath = path.join(projectPath, ".gitignore");
  if (!fs.existsSync(gitignorePath)) return [];
  return fs.readFileSync(gitignorePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("!"))
    .map((line) => toPatternMatcher(line));
}

export class FileScanner {
  scan(projectPath: string): ScannedFile[] {
    const ignoreMatchers = loadIgnoreMatchers(projectPath);
    const files: ScannedFile[] = [];
    const visit = (dirPath: string, relativeDir = "") => {
      for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        const relativePath = path.posix.join(relativeDir.replace(/\\/g, "/"), entry.name).replace(/^\/+/, "");
        if (ignoreMatchers.some((matcher) => matcher(relativePath, entry.isDirectory()))) {
          continue;
        }
        const absolutePath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          visit(absolutePath, relativePath);
          continue;
        }
        if (!entry.isFile()) continue;
        const stat = fs.statSync(absolutePath);
        files.push({
          path: relativePath,
          absolutePath,
          size: stat.size,
          mtimeMs: stat.mtimeMs
        });
      }
    };
    visit(projectPath);
    return files.sort((a, b) => a.path.localeCompare(b.path));
  }
}
