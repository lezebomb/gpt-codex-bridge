import fs from "node:fs";
import path from "node:path";

import { nanoid } from "nanoid";

import { EVENTS_DIR } from "../../config.js";
import { compactForLog, ensureDir, now } from "../../lib/common.js";
import { RuntimeEvent, RuntimeEventType } from "../../types.js";

export class EventStore {
  constructor() {
    ensureDir(EVENTS_DIR);
  }

  private fileForRun(runId: string): string {
    return path.join(EVENTS_DIR, `${runId}.events.jsonl`);
  }

  append(input: Omit<RuntimeEvent, "id" | "timestamp"> & { timestamp?: string }): RuntimeEvent {
    const event: RuntimeEvent = {
      id: nanoid(10),
      runId: input.runId,
      type: input.type,
      timestamp: input.timestamp || now(),
      projectId: input.projectId,
      taskId: input.taskId,
      taskBranchId: input.taskBranchId,
      executorMode: input.executorMode,
      toolName: input.toolName,
      requestId: input.requestId,
      message: input.message,
      data: compactForLog(input.data, 8000)
    };
    fs.appendFileSync(this.fileForRun(event.runId), `${JSON.stringify(event)}\n`, "utf8");
    return event;
  }

  list(options?: { runId?: string; projectId?: string; taskId?: string; taskBranchId?: string; type?: RuntimeEventType; requestId?: string; limit?: number }): RuntimeEvent[] {
    const limit = options?.limit ?? 200;
    if (!fs.existsSync(EVENTS_DIR)) return [];
    const files = options?.runId
      ? [`${options.runId}.events.jsonl`]
      : fs.readdirSync(EVENTS_DIR).filter((file) => file.endsWith(".events.jsonl")).sort().reverse();
    const events: RuntimeEvent[] = [];
    for (const file of files) {
      const fullPath = path.join(EVENTS_DIR, file);
      if (!fs.existsSync(fullPath)) continue;
      const lines = fs.readFileSync(fullPath, "utf8").split("\n").filter(Boolean).reverse();
      for (const line of lines) {
        try {
          const event = JSON.parse(line) as RuntimeEvent;
          if (options?.projectId && event.projectId !== options.projectId) continue;
          if (options?.taskId && event.taskId !== options.taskId) continue;
          if (options?.taskBranchId && event.taskBranchId !== options.taskBranchId) continue;
          if (options?.type && event.type !== options.type) continue;
          if (options?.requestId && event.requestId !== options.requestId) continue;
          events.push(event);
          if (events.length >= limit) return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        } catch {
          // Ignore malformed event lines.
        }
      }
    }
    return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
}

