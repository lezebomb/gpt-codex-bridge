import fs from "node:fs";
import path from "node:path";

import { LOGS_DIR } from "../config.js";
import { compactForLog, ensureDir } from "../lib/common.js";
import { LogEntry } from "../types.js";

export class LogStore {
  constructor() {
    ensureDir(LOGS_DIR);
  }

  private fileForDate(date = new Date()): string {
    return path.join(LOGS_DIR, `${date.toISOString().slice(0, 10)}.jsonl`);
  }

  write(entry: Omit<LogEntry, "id" | "timestamp"> & { timestamp?: string }): LogEntry {
    const timestamp = entry.timestamp || new Date().toISOString();
    const full: LogEntry = {
      id: Math.random().toString(36).slice(2, 12),
      timestamp,
      level: entry.level,
      source: entry.source,
      action: entry.action,
      message: entry.message,
      requestId: entry.requestId,
      projectId: entry.projectId,
      taskId: entry.taskId,
      taskBranchId: entry.taskBranchId,
      runId: entry.runId,
      details: compactForLog(entry.details, 5000)
    };
    fs.appendFileSync(this.fileForDate(), `${JSON.stringify(full)}\n`, "utf8");
    return full;
  }

  list(options?: { limit?: number; level?: LogEntry["level"]; requestId?: string; projectId?: string; taskId?: string; taskBranchId?: string; runId?: string }): LogEntry[] {
    const limit = options?.limit ?? 100;
    if (!fs.existsSync(LOGS_DIR)) {
      return [];
    }
    const files = fs.readdirSync(LOGS_DIR).filter((file) => file.endsWith(".jsonl")).sort().reverse();
    const out: LogEntry[] = [];
    for (const file of files) {
      const lines = fs.readFileSync(path.join(LOGS_DIR, file), "utf8").split("\n").filter(Boolean).reverse();
      for (const line of lines) {
        try {
          const entry = JSON.parse(line) as LogEntry;
          if (options?.level && entry.level !== options.level) {
            continue;
          }
          if (options?.requestId && entry.requestId !== options.requestId) {
            continue;
          }
          if (options?.projectId && entry.projectId !== options.projectId) {
            continue;
          }
          if (options?.taskId && entry.taskId !== options.taskId) {
            continue;
          }
          if (options?.taskBranchId && entry.taskBranchId !== options.taskBranchId) {
            continue;
          }
          if (options?.runId && entry.runId !== options.runId) {
            continue;
          }
          out.push(entry);
          if (out.length >= limit) {
            return out;
          }
        } catch {
          // Ignore malformed lines.
        }
      }
    }
    return out;
  }
}
