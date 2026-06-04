import { DatabaseSync } from "node:sqlite";
import path from "node:path";

import { ensureDir, summarizeText } from "../../lib/common.js";

export type IndexedDocument = {
  path: string;
  summary: string;
  body: string;
  size: number;
  mtimeMs: number;
};

export type ContextSearchProvider = "fts" | "fallback" | "hybrid";

export type ContextSearchHit = {
  path: string;
  summary: string;
  score: number;
};

export type ContextSearchResult = {
  provider: ContextSearchProvider;
  warning?: string;
  normalizedQuery?: string;
  results: ContextSearchHit[];
};

function quoted(token: string): string {
  return `"${token.replaceAll("\"", "\"\"")}"`;
}

function tokenizeQuery(query: string): string[] {
  const matches = String(query || "").match(/[\p{Script=Han}]+|[A-Za-z0-9_]+/gu) || [];
  return Array.from(new Set(matches.map((token) => token.trim()).filter(Boolean)));
}

export function safeFtsQuery(query: string): { normalizedQuery: string; fallbackTokens: string[]; shouldFallback: boolean; warning?: string } {
  const raw = String(query || "").trim();
  const tokens = tokenizeQuery(raw);
  const hasHan = /[\p{Script=Han}]/u.test(raw);
  const hasPunctuation = /[./\\:()"'`-]/.test(raw);
  if (!tokens.length) {
    return {
      normalizedQuery: "",
      fallbackTokens: raw ? [raw] : [],
      shouldFallback: true,
      warning: "Fallback search used because the query could not be safely tokenized."
    };
  }
  if (hasHan) {
    return {
      normalizedQuery: "",
      fallbackTokens: tokens,
      shouldFallback: true,
      warning: "Fallback search used for Chinese or mixed natural-language query."
    };
  }
  const normalizedQuery = tokens.map((token) => quoted(token.toLowerCase())).join(" OR ");
  return {
    normalizedQuery,
    fallbackTokens: tokens,
    shouldFallback: hasPunctuation,
    warning: hasPunctuation ? "FTS query normalized before search." : undefined
  };
}

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

  private fallbackSearch(db: DatabaseSync, query: string, tokens: string[], limit: number, warning?: string): ContextSearchResult {
    const searchTerms = Array.from(new Set(tokens.length ? tokens : [String(query || "").trim()].filter(Boolean)));
    if (!searchTerms.length) {
      return {
        provider: "fallback",
        warning: warning || "Fallback search used with an empty-safe query.",
        results: []
      };
    }
    const clauses = searchTerms.map(() => "(LOWER(files_meta.path) LIKE ? OR LOWER(files_meta.summary) LIKE ? OR LOWER(files_fts.body) LIKE ?)").join(" OR ");
    const params: string[] = [];
    for (const term of searchTerms) {
      const like = `%${term.toLowerCase()}%`;
      params.push(like, like, like);
    }
    const stmt = db.prepare(`
      SELECT files_meta.path as path, files_meta.summary as summary, files_fts.body as body
      FROM files_meta
      JOIN files_fts ON files_fts.path = files_meta.path
      WHERE ${clauses}
      LIMIT ?
    `);
    const rows = stmt.all(...params, limit) as Array<{ path: string; summary: string; body: string }>;
    return {
      provider: "fallback",
      warning: warning || "Fallback search used.",
      results: rows.map((row) => {
        const haystack = `${row.path}\n${row.summary}\n${row.body}`.toLowerCase();
        const score = searchTerms.reduce((total, term) => total + (haystack.includes(term.toLowerCase()) ? 1 : 0), 0);
        return {
          path: row.path,
          summary: summarizeText(row.summary, 240),
          score: Math.max(1, score)
        };
      }).sort((a, b) => b.score - a.score)
    };
  }

  search(query: string, limit: number): ContextSearchResult {
    const db = this.open();
    const safe = safeFtsQuery(query);
    if (safe.shouldFallback || !safe.normalizedQuery) {
      const result = this.fallbackSearch(db, query, safe.fallbackTokens, limit, safe.warning);
      db.close();
      return result;
    }
    try {
      const stmt = db.prepare(`
        SELECT files_meta.path as path, files_meta.summary as summary, bm25(files_fts) as score
        FROM files_fts
        JOIN files_meta ON files_meta.path = files_fts.path
        WHERE files_fts MATCH ?
        ORDER BY score
        LIMIT ?
      `);
      const rows = stmt.all(safe.normalizedQuery, limit) as Array<{ path: string; summary: string; score: number }>;
      if (rows.length) {
        db.close();
        return {
          provider: safe.warning ? "hybrid" : "fts",
          warning: safe.warning,
          normalizedQuery: safe.normalizedQuery,
          results: rows
        };
      }
      const fallback = this.fallbackSearch(db, query, safe.fallbackTokens, limit, safe.warning || "Fallback search used after FTS returned no matches.");
      db.close();
      return {
        provider: "hybrid",
        warning: fallback.warning,
        normalizedQuery: safe.normalizedQuery,
        results: fallback.results
      };
    } catch (error) {
      const fallback = this.fallbackSearch(
        db,
        query,
        safe.fallbackTokens,
        limit,
        `Fallback search used because FTS could not parse the query: ${error instanceof Error ? error.message : String(error)}`
      );
      db.close();
      return fallback;
    }
  }
}
