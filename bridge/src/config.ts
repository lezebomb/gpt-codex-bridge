import path from "node:path";
import { z } from "zod";

import { McpPlugin, executionModeSchema } from "./types.js";

export const ROOT = path.resolve(process.cwd());
export const REPO_ROOT = path.resolve(ROOT, "..");
export const DATA_DIR = path.join(ROOT, "data");
export const LOGS_DIR = path.join(DATA_DIR, "logs");
export const CONTEXT_PACKS_DIR = path.join(DATA_DIR, "context-packs");
export const SCREENSHOTS_DIR = path.join(DATA_DIR, "screenshots");
export const INDEXES_DIR = path.join(DATA_DIR, "indexes");
export const STATE_FILE = path.join(DATA_DIR, "state.json");
export const RUNTIME_FILE = path.join(DATA_DIR, "runtime.json");
export const ROLE_DIR = path.join(REPO_ROOT, "roles");
export const LOCAL_SKILL_DIR = path.join(REPO_ROOT, ".agents", "skills");
export const GLOBAL_HOME_SKILL_DIR = path.join(path.resolve(process.env.USERPROFILE || process.env.HOME || REPO_ROOT), ".agents", "skills");
export const EXTERNAL_EXECUTOR_CONFIG_FILE = path.join(ROOT, "config", "external-executors.json");
export const DASHBOARD_DIR = path.join(ROOT, "public");
export const PORT = Number(process.env.BRIDGE_PORT || 8787);
export const HOST = process.env.BRIDGE_HOST || "127.0.0.1";
export const VERSION = "2.0.0";
export const MAX_FILE_BYTES = Number(process.env.MAX_FILE_BYTES || 200_000);
export const MAX_TREE_ENTRIES = Number(process.env.MAX_TREE_ENTRIES || 500);
export const MAX_CONTEXT_FILES = Number(process.env.MAX_CONTEXT_FILES || 30);
export const MAX_REVIEW_ROUNDS = 2;
export const MAX_CONTEXT_RETRIEVE_FILES = 8;
export const MAX_CONTEXT_RETRIEVE_SNIPPETS = 20;
export const MAX_CONTEXT_PACK_INLINE_CHARS = 12_000;
export const DEFAULT_EXECUTION = executionModeSchema.catch("dry-run").parse(process.env.CODEX_EXECUTION || "dry-run");
export const CODEX_BIN = process.env.CODEX_BIN || "codex";
export const CODEX_ARGS = (process.env.CODEX_ARGS || "exec --json").split(" ").filter(Boolean);
export const CODEX_APP_SERVER_MODEL = process.env.CODEX_APP_SERVER_MODEL || "";
export const CODEX_JOB_TIMEOUT_MS = Number(process.env.CODEX_JOB_TIMEOUT_MS || 20 * 60 * 1000);
export const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", ".next", "coverage", ".turbo", ".cache"]);
export const GLOBAL_RULE_CANDIDATES = ["AGENTS.md", "CLAUDE.md", ".cursorrules", "CONTRIBUTING.md"];
export const MCP_PLUGINS: McpPlugin[] = [
  {
    id: "filesystem-restricted",
    name: "Filesystem Restricted",
    status: "built-in",
    risk: "medium",
    canReadFiles: true,
    canWriteFiles: true,
    canAccessNetwork: false,
    needsToken: false,
    description: "Project-scoped file browsing, reading, context packs, patch drafts, and guarded patch apply/revert."
  },
  {
    id: "git-read-only",
    name: "Git Read Only",
    status: "built-in",
    risk: "low",
    canReadFiles: true,
    canWriteFiles: false,
    canAccessNetwork: false,
    needsToken: false,
    description: "Reads git status and git diff for registered projects."
  },
  {
    id: "playwright",
    name: "Playwright",
    status: "available",
    risk: "medium",
    canReadFiles: true,
    canWriteFiles: true,
    canAccessNetwork: true,
    needsToken: false,
    description: "Optional browser screenshots and dashboard smoke tests."
  },
  {
    id: "context7",
    name: "Context7",
    status: "available",
    risk: "medium",
    canReadFiles: false,
    canWriteFiles: false,
    canAccessNetwork: true,
    needsToken: false,
    description: "Optional library documentation lookup."
  },
  {
    id: "fetch",
    name: "Fetch",
    status: "available",
    risk: "medium",
    canReadFiles: false,
    canWriteFiles: false,
    canAccessNetwork: true,
    needsToken: false,
    description: "Optional web fetch capability."
  },
  {
    id: "github",
    name: "GitHub",
    status: "available",
    risk: "high",
    canReadFiles: true,
    canWriteFiles: true,
    canAccessNetwork: true,
    needsToken: true,
    description: "Optional GitHub CLI integration for PR workflows."
  },
  {
    id: "memory",
    name: "Memory",
    status: "not_implemented",
    risk: "medium",
    canReadFiles: true,
    canWriteFiles: true,
    canAccessNetwork: false,
    needsToken: false,
    description: "Planned project memory integration."
  },
  {
    id: "sequential-thinking",
    name: "Sequential Thinking",
    status: "not_implemented",
    risk: "low",
    canReadFiles: false,
    canWriteFiles: false,
    canAccessNetwork: false,
    needsToken: false,
    description: "Planned reasoning helper."
  }
];

export const createCrossReviewDecisionSchema = z.enum(["use_webagent_result", "use_codex_result", "hybrid", "needs_human"]);
