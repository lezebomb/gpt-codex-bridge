import fs from "node:fs";
import path from "node:path";

import { nanoid } from "nanoid";

export function now(): string {
  return new Date().toISOString();
}

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function generateLocalToken(): string {
  return `bridge-${nanoid(24)}`;
}

export function tokenPreview(token: string): string {
  if (token.length <= 8) {
    return "****";
  }
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

export function compactForLog(value: unknown, max = 4000): unknown {
  let text = "";
  try {
    text = JSON.stringify(value) ?? "";
  } catch {
    text = String(value);
  }
  if (text.length <= max) {
    return value;
  }
  return { truncated: true, preview: text.slice(0, max) };
}

export function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJsonFile(filePath: string, value: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

export function filePreview(filePath: string, max = 4000): string | null {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile() || stat.size > 1024 * 1024) {
      return null;
    }
    return fs.readFileSync(filePath, "utf8").slice(0, max);
  } catch {
    return null;
  }
}

export function uniqueStrings(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}
