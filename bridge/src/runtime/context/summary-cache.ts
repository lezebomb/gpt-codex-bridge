import fs from "node:fs";
import path from "node:path";

import { ensureDir, sha256Text, summarizeText } from "../../lib/common.js";

export type SummaryRecord = {
  path: string;
  summary: string;
  size: number;
  mtimeMs: number;
  hash?: string;
};

export class SummaryCache {
  load(filePath: string): Map<string, SummaryRecord> {
    const cache = new Map<string, SummaryRecord>();
    if (!fs.existsSync(filePath)) return cache;
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        const record = JSON.parse(line) as SummaryRecord;
        cache.set(record.path, record);
      } catch {
        // Ignore malformed lines from older runs.
      }
    }
    return cache;
  }

  save(filePath: string, records: SummaryRecord[]): void {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, records.map((record) => JSON.stringify(record)).join("\n"), "utf8");
  }

  summarize(content: string): string {
    return summarizeText(content, 500);
  }

  hash(content: string): string {
    return sha256Text(content);
  }
}
