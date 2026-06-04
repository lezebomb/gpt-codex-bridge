import path from "node:path";

import { BridgeService } from "../dist/bridge-service.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const service = new BridgeService();
  const repoRoot = path.resolve(process.cwd(), "..");
  const demoProjectPath = path.join(repoRoot, "examples", "demo-project");
  const selected = service.selectProject({ path: demoProjectPath, displayName: "demo-project-context-budget" });

  const small = await service.createContextPack({
    projectId: selected.project.id,
    goal: "Understand the Start workflow button implementation",
    paths: ["src/App.tsx"],
    budget: "small"
  });
  assert(small.summary.budget === "small", "small budget should be recorded in context pack summary");
  assert(small.markdown.includes("## Retrieved Context"), "bounded context pack should prefer retrieved context by default");
  assert(!small.markdown.includes("## Relevant Files"), "retrieved context packs should avoid full file dumps by default");
  assert(!small.markdown.includes("## Directory Summary"), "small budget should skip the directory tree to save tokens");
  assert((small.markdown.match(/^### /gm) || []).length <= 5, "small budget should keep relevant file sections within the five-file budget");

  const large = await service.createContextPack({
    projectId: selected.project.id,
    goal: "Understand the Start workflow button implementation",
    paths: ["src/App.tsx"],
    budget: "large"
  });
  assert(large.summary.budget === "large", "large budget should be recorded in context pack summary");
  assert(large.markdown.includes("## Directory Summary"), "large budget should keep a directory summary for broader orientation");

  console.log("Context budget test passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
