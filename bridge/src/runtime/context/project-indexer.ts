import fs from "node:fs";
import path from "node:path";

import { INDEXES_DIR, MAX_FILE_BYTES } from "../../config.js";
import { ensureDir, now, summarizeText, truncateText } from "../../lib/common.js";
import { Project, ProjectIndexRecord } from "../../types.js";
import { FileScanner } from "./file-scanner.js";
import { FtsIndex, IndexedDocument } from "./fts-index.js";
import { SummaryCache, SummaryRecord } from "./summary-cache.js";

export class ProjectIndexer {
  readonly scanner = new FileScanner();
  readonly summaryCache = new SummaryCache();

  paths(projectId: string) {
    const baseDir = path.join(INDEXES_DIR, projectId);
    return {
      baseDir,
      sqlitePath: path.join(baseDir, "files.sqlite"),
      summariesPath: path.join(baseDir, "summaries.jsonl"),
      manifestPath: path.join(baseDir, "manifest.json")
    };
  }

  getStatus(projectId: string): ProjectIndexRecord {
    const paths = this.paths(projectId);
    if (!fs.existsSync(paths.manifestPath)) {
      return {
        projectId,
        status: "missing",
        indexedFiles: 0,
        staleFiles: [],
        indexSize: 0,
        enabledProviders: ["fts5", "summary-cache", "symbol:none", "vector:none"],
        manifestPath: paths.manifestPath,
        sqlitePath: paths.sqlitePath,
        summariesPath: paths.summariesPath,
        createdAt: now(),
        updatedAt: now()
      };
    }
    return JSON.parse(fs.readFileSync(paths.manifestPath, "utf8")) as ProjectIndexRecord;
  }

  indexProject(project: Project, force = false): ProjectIndexRecord {
    const paths = this.paths(project.id);
    ensureDir(paths.baseDir);
    const files = this.scanner.scan(project.path);
    const cached = this.summaryCache.load(paths.summariesPath);
    const documents: IndexedDocument[] = [];
    const summaries: SummaryRecord[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        const summary = `Large file (${file.size} bytes). Read this file explicitly when needed.`;
        documents.push({ path: file.path, summary, body: summary, size: file.size, mtimeMs: file.mtimeMs });
        summaries.push({ path: file.path, summary, size: file.size, mtimeMs: file.mtimeMs });
        continue;
      }
      const cachedRecord = cached.get(file.path);
      if (!force && cachedRecord && cachedRecord.mtimeMs === file.mtimeMs) {
        const content = fs.readFileSync(file.absolutePath, "utf8");
        documents.push({
          path: file.path,
          summary: cachedRecord.summary,
          body: truncateText(content, 40_000),
          size: file.size,
          mtimeMs: file.mtimeMs
        });
        summaries.push(cachedRecord);
        continue;
      }
      const content = fs.readFileSync(file.absolutePath, "utf8");
      const summary = summarizeText(content, 500) || summarizeText(file.path, 200);
      documents.push({
        path: file.path,
        summary,
        body: truncateText(content, 40_000),
        size: file.size,
        mtimeMs: file.mtimeMs
      });
      summaries.push({ path: file.path, summary, size: file.size, mtimeMs: file.mtimeMs });
    }

    new FtsIndex(paths.sqlitePath).rebuild(documents);
    this.summaryCache.save(paths.summariesPath, summaries);
    const stats = fs.existsSync(paths.sqlitePath) ? fs.statSync(paths.sqlitePath) : null;
    const manifest: ProjectIndexRecord = {
      projectId: project.id,
      status: "ready",
      indexedFiles: files.length,
      lastIndexedAt: now(),
      staleFiles: [],
      indexSize: stats?.size || 0,
      enabledProviders: ["fts5", "summary-cache", "symbol:none", "vector:none"],
      manifestPath: paths.manifestPath,
      sqlitePath: paths.sqlitePath,
      summariesPath: paths.summariesPath,
      createdAt: this.getStatus(project.id).createdAt || now(),
      updatedAt: now()
    };
    fs.writeFileSync(paths.manifestPath, JSON.stringify(manifest, null, 2), "utf8");
    return manifest;
  }
}
