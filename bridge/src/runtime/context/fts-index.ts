import { DatabaseSync } from "node:sqlite";
import path from "node:path";

import { ensureDir } from "../../lib/common.js";

export type IndexedDocument = {
  path: string;
  summary: string;
  body: string;
  size: number;
  mtimeMs: number;
};

export class FtsIndex {
  constructor(private readonly sqlitePath: string) {}

  private open(): DatabaseSync {
    ensureDir(path.dirname(this.sqlitePath));
    const db = new DatabaseSync(this.sqlitePath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS files_meta (
        path TEXT PRIMARY KEY,
        summary TEXT NOT NULL,
        size INTEGER NOT NULL,
        mtime_ms INTEGER NOT NULL
      );
      CREATE VIRTUAL TABLE IF NOT EXISTS files_fts USING fts5(
        path UNINDEXED,
        body,
        tokenize = 'porter unicode61'
      );
    `);
    return db;
  }

  rebuild(documents: IndexedDocument[]): void {
    const db = this.open();
    db.exec("DELETE FROM files_meta; DELETE FROM files_fts;");
    const metaStmt = db.prepare("INSERT INTO files_meta(path, summary, size, mtime_ms) VALUES (?, ?, ?, ?)");
    const ftsStmt = db.prepare("INSERT INTO files_fts(path, body) VALUES (?, ?)");
    db.exec("BEGIN");
    try {
      for (const row of documents) {
        metaStmt.run(row.path, row.summary, row.size, row.mtimeMs);
        ftsStmt.run(row.path, row.body);
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      db.close();
      throw error;
    }
    db.close();
  }

  search(query: string, limit: number): Array<{ path: string; summary: string; score: number }> {
    const db = this.open();
    const stmt = db.prepare(`
      SELECT files_meta.path as path, files_meta.summary as summary, bm25(files_fts) as score
      FROM files_fts
      JOIN files_meta ON files_meta.path = files_fts.path
      WHERE files_fts MATCH ?
      ORDER BY score
      LIMIT ?
    `);
    const rows = stmt.all(query, limit) as Array<{ path: string; summary: string; score: number }>;
    db.close();
    return rows;
  }
}
