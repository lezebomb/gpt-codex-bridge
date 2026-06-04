import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { BridgeService } from "../dist/bridge-service.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  const service = new BridgeService();
  const repoRoot = path.resolve(process.cwd(), "..");
  const demoProjectPath = path.join(repoRoot, "examples", "demo-project");
  const isolatedProjectPath = path.join(os.tmpdir(), `bridge-fts-query-${Date.now()}`);
  fs.cpSync(demoProjectPath, isolatedProjectPath, { recursive: true });
  const selected = service.selectProject({ path: isolatedProjectPath, displayName: "demo-project-fts" });
  service.indexProject({ projectId: selected.project.id, force: true });

  const queries = [
    "src/App.tsx",
    "auth.verify()",
    "登录页 验证码",
    "foo:bar",
    "\"broken quote"
  ];

  for (const query of queries) {
    const result = service.searchProject({ projectId: selected.project.id, query, limit: 4 });
    assert(result.provider, `search_project should report provider for query: ${query}`);
  }

  console.log("FTS safe query test passed.");
}

main();
