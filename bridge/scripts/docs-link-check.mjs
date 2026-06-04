import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "..");
const targets = [
  path.join(repoRoot, "README.md"),
  path.join(repoRoot, "QUICKSTART.md"),
  path.join(process.cwd(), "README.md"),
  path.join(repoRoot, "docs")
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function collectMarkdown(filePath, out = []) {
  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(filePath)) {
      collectMarkdown(path.join(filePath, entry), out);
    }
    return out;
  }
  if (filePath.endsWith(".md")) {
    out.push(filePath);
  }
  return out;
}

function main() {
  const files = targets.flatMap((target) => collectMarkdown(target));
  const offenders = [];
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    if (/C:\\Users\\|\/C:\/Users\/|Desktop\/gpt-codex-bridge/.test(content)) {
      offenders.push(path.relative(repoRoot, file));
    }
  }
  assert(!offenders.length, `Markdown files still contain local absolute paths: ${offenders.join(", ")}`);
  console.log(`Docs link check passed: ${files.length} markdown files scanned.`);
}

main();
