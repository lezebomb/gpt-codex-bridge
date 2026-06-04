import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { IGNORED_DIRS, MAX_FILE_BYTES, MAX_TREE_ENTRIES, REPO_ROOT } from "./config.js";
import { filePreview } from "./lib/common.js";
import { Project, WebPatchChange } from "./types.js";

export function expandHome(inputPath: string): string {
  if (inputPath === "~") {
    return os.homedir();
  }
  if (inputPath.startsWith("~/")) {
    return path.join(os.homedir(), inputPath.slice(2));
  }
  return inputPath;
}

export function safeProjectPath(inputPath: string): string {
  const resolved = path.resolve(expandHome(inputPath));
  if (!fs.existsSync(resolved)) {
    throw new Error("project path does not exist");
  }
  if (!fs.statSync(resolved).isDirectory()) {
    throw new Error("project path is not a directory");
  }
  return resolved;
}

function uniqueByPath<T extends { path: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = path.resolve(item.path).toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function safeDirectoryInfo(dirPath: string, label?: string) {
  const resolved = path.resolve(expandHome(dirPath));
  return {
    name: label || path.basename(resolved) || resolved,
    path: resolved,
    exists: fs.existsSync(resolved),
    type: "dir" as const
  };
}

function isSensitiveDirectory(dirPath: string): boolean {
  const resolved = path.resolve(dirPath).toLowerCase();
  const blocked = ["windows\\system32", "$recycle.bin", "system volume information", "appdata\\local\\temp"];
  return blocked.some((name) => resolved.includes(name));
}

export function listFilesystemRoots() {
  const home = os.homedir();
  const roots = [
    safeDirectoryInfo(home, "Home"),
    safeDirectoryInfo(path.join(home, "Desktop"), "Desktop"),
    safeDirectoryInfo(path.join(home, "Documents"), "Documents"),
    safeDirectoryInfo(REPO_ROOT, "Repository")
  ];

  if (process.platform === "win32") {
    for (let code = 67; code <= 90; code += 1) {
      const drive = `${String.fromCharCode(code)}:\\`;
      if (fs.existsSync(drive)) {
        roots.push(safeDirectoryInfo(drive, drive));
      }
    }
  } else {
    roots.push(safeDirectoryInfo("/", "/"));
  }

  return uniqueByPath(roots).filter((item) => item.exists);
}

export function listBrowsableDirectories(inputPath?: string) {
  if (!inputPath) {
    return {
      currentPath: "",
      parentPath: null,
      roots: listFilesystemRoots(),
      directories: [] as Array<{ name: string; path: string; type: "dir" }>
    };
  }

  const resolved = safeProjectPath(inputPath);
  if (isSensitiveDirectory(resolved)) {
    throw new Error("this system directory is hidden by default");
  }
  const directories = fs.readdirSync(resolved, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !IGNORED_DIRS.has(entry.name))
    .map((entry) => ({ name: entry.name, path: path.join(resolved, entry.name), type: "dir" as const }))
    .filter((entry) => !isSensitiveDirectory(entry.path))
    .sort((a, b) => a.name.localeCompare(b.name));
  const parent = path.dirname(resolved);
  return {
    currentPath: resolved,
    parentPath: parent === resolved ? null : parent,
    roots: [] as ReturnType<typeof listFilesystemRoots>,
    directories
  };
}

export function assertSafeRelativePath(relativePath: string): string {
  if (!relativePath || relativePath.includes("\0")) {
    throw new Error("invalid file path");
  }
  if (path.isAbsolute(relativePath)) {
    throw new Error("absolute file paths are not allowed");
  }
  const normalized = path.normalize(relativePath).replace(/^([/\\])+/, "");
  if (normalized === "." || normalized.startsWith("..") || normalized.includes(`${path.sep}..${path.sep}`)) {
    throw new Error("path traversal is not allowed");
  }
  const parts = normalized.split(/[\\/]+/);
  if (parts.some((part) => IGNORED_DIRS.has(part))) {
    throw new Error("access to ignored directories is not allowed");
  }
  return normalized;
}

export function resolveProjectFile(project: Pick<Project, "path">, relativePath: string): string {
  const safeRelative = assertSafeRelativePath(relativePath);
  const fullPath = path.resolve(project.path, safeRelative);
  const projectRoot = path.resolve(project.path);
  if (fullPath !== projectRoot && !fullPath.startsWith(projectRoot + path.sep)) {
    throw new Error("resolved path escapes project root");
  }
  return fullPath;
}

export function walkFiles(root: string, current = "", limit = MAX_TREE_ENTRIES): Array<{ path: string; type: "file" | "dir"; size?: number }> {
  const absolute = path.join(root, current);
  if (!fs.existsSync(absolute)) {
    return [];
  }
  const entries = fs.readdirSync(absolute, { withFileTypes: true })
    .filter((entry) => !IGNORED_DIRS.has(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name));
  const out: Array<{ path: string; type: "file" | "dir"; size?: number }> = [];
  for (const entry of entries) {
    if (out.length >= limit) {
      break;
    }
    const rel = path.join(current, entry.name);
    const full = path.join(root, rel);
    if (entry.isDirectory()) {
      out.push({ path: rel, type: "dir" });
      out.push(...walkFiles(root, rel, Math.max(0, limit - out.length)));
    } else if (entry.isFile()) {
      out.push({ path: rel, type: "file", size: fs.statSync(full).size });
    }
  }
  return out.slice(0, limit);
}

export function readProjectFile(project: Pick<Project, "path">, relativePath: string, maxBytes = MAX_FILE_BYTES) {
  const fullPath = resolveProjectFile(project, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error("file not found");
  }
  const stat = fs.statSync(fullPath);
  if (!stat.isFile()) {
    throw new Error("path is not a file");
  }
  if (stat.size > maxBytes) {
    throw new Error(`file too large: ${stat.size} bytes > ${maxBytes} bytes`);
  }
  return {
    path: assertSafeRelativePath(relativePath),
    size: stat.size,
    updatedAt: stat.mtime.toISOString(),
    content: fs.readFileSync(fullPath, "utf8")
  };
}

export function validatePatchChanges(project: Pick<Project, "path">, changes: WebPatchChange[]) {
  if (!changes.length) {
    throw new Error("patch must include at least one change");
  }
  if (changes.length > 20) {
    throw new Error("too many files in one patch; split into smaller patches");
  }
  return changes.map((change) => {
    const normalized = assertSafeRelativePath(change.filePath);
    const fullPath = resolveProjectFile(project, normalized);
    const exists = fs.existsSync(fullPath);
    if (change.mode === "create" && exists) {
      throw new Error(`file already exists: ${normalized}`);
    }
    if (change.mode === "overwrite" && exists && !fs.statSync(fullPath).isFile()) {
      throw new Error(`not a file: ${normalized}`);
    }
    if (Buffer.byteLength(change.content, "utf8") > MAX_FILE_BYTES) {
      throw new Error(`file content too large for ${normalized}`);
    }
    return { ...change, filePath: normalized };
  });
}

export function inferTechStack(projectPath: string): string[] {
  const stack = new Set<string>();
  const packageJsonPath = path.join(projectPath, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    stack.add("node");
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as Record<string, unknown>;
      const deps = {
        ...(typeof pkg.dependencies === "object" && pkg.dependencies ? (pkg.dependencies as Record<string, string>) : {}),
        ...(typeof pkg.devDependencies === "object" && pkg.devDependencies ? (pkg.devDependencies as Record<string, string>) : {})
      };
      for (const name of Object.keys(deps)) {
        if (name === "react") stack.add("react");
        if (name === "next") stack.add("nextjs");
        if (name === "vue") stack.add("vue");
        if (name === "svelte") stack.add("svelte");
        if (name === "typescript") stack.add("typescript");
        if (name === "tailwindcss") stack.add("tailwindcss");
        if (name === "vite") stack.add("vite");
        if (name === "express") stack.add("express");
        if (name === "@modelcontextprotocol/sdk") stack.add("mcp");
      }
    } catch {
      // Ignore malformed package.json in heuristic output.
    }
  }
  if (fs.existsSync(path.join(projectPath, "pyproject.toml"))) stack.add("python");
  if (fs.existsSync(path.join(projectPath, "requirements.txt"))) stack.add("python");
  if (fs.existsSync(path.join(projectPath, "Cargo.toml"))) stack.add("rust");
  if (fs.existsSync(path.join(projectPath, "go.mod"))) stack.add("go");
  if (fs.existsSync(path.join(projectPath, "tsconfig.json"))) stack.add("typescript");
  return Array.from(stack);
}

export function findReadmePreview(projectPath: string): string | null {
  const readme = ["README.md", "readme.md", "README.MD"]
    .map((file) => path.join(projectPath, file))
    .find((candidate) => fs.existsSync(candidate));
  return readme ? filePreview(readme, 6000) : null;
}
