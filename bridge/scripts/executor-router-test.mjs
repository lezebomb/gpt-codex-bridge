import { ExecutorRouter } from "../dist/executors/router.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  const router = new ExecutorRouter();

  const explicitCodex = router.route({ goal: "Please use Codex to refactor this module", targetFiles: [] });
  assert(explicitCodex.mode === "codex", "Explicit Codex request should route to codex");

  const uiTask = router.route({ goal: "Polish UI copy and CSS in one file", targetFiles: ["src/App.tsx"] });
  assert(uiTask.mode === "webagent", "Small UI task should stay on webagent");

  const complexQuota = router.route({ goal: "Refactor multi-file backend flow and fix tests", targetFiles: ["a.ts", "b.ts", "c.ts", "d.ts"] });
  assert(complexQuota.mode === "webagent", "save_codex_quota should keep complex tasks on webagent by default");
  assert(complexQuota.recommendedMode === "codex", "save_codex_quota should still recommend codex for deep work");

  const bestResult = router.route({ goal: "Refactor multi-file backend flow and fix tests", targetFiles: ["a.ts", "b.ts", "c.ts", "d.ts"], requestedPolicy: "best_result" });
  assert(bestResult.mode === "codex", "best_result should choose codex for complex tasks");

  console.log("Executor router test passed.");
}

main();
