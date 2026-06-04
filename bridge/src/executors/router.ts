import { ExecutorMode, ExecutorPolicy } from "../types.js";

export type ExecutorRoutingInput = {
  requestedMode?: ExecutorMode;
  requestedPolicy?: ExecutorPolicy;
  goal: string;
  targetFiles: string[];
  externalExecutorId?: string;
};

export type ExecutorRoutingResult = {
  mode: ExecutorMode;
  policy: ExecutorPolicy;
  reasons: string[];
};

export class ExecutorRouter {
  route(input: ExecutorRoutingInput): ExecutorRoutingResult {
    const policy = input.requestedPolicy || "save_codex_quota";
    if (input.requestedMode) {
      return { mode: input.requestedMode, policy, reasons: ["User explicitly selected an executor mode."] };
    }
    if (input.externalExecutorId) {
      return { mode: "external", policy: "manual", reasons: ["An external executor id was provided."] };
    }

    const goal = input.goal.toLowerCase();
    const reasons: string[] = [];
    const codexHints = [
      "refactor",
      "multi-file",
      "integration",
      "test",
      "failing",
      "ci",
      "dependency",
      "install",
      "stack trace",
      "debug",
      "error",
      "bug",
      "migration",
      "重构",
      "测试",
      "依赖",
      "报错",
      "多文件",
      "集成"
    ];
    const uiHints = ["ui", "css", "copy", "wording", "component", "layout", "视觉", "样式", "文案", "组件"];

    if (goal.includes("directly use codex") || goal.includes("直接用 codex")) {
      return { mode: "codex", policy, reasons: ["The request explicitly asked for Codex."] };
    }
    if (goal.includes("hybrid") || goal.includes("交叉审查") || goal.includes("cross review")) {
      return { mode: "hybrid", policy: input.requestedPolicy || "best_result", reasons: ["The request mentions a hybrid or cross-review flow."] };
    }
    if (codexHints.some((token) => goal.includes(token)) || input.targetFiles.length > 3) {
      reasons.push("The task looks like a multi-file implementation, debugging, or test-fix job.");
      return { mode: policy === "save_codex_quota" ? "codex" : policy === "best_result" ? "hybrid" : "codex", policy, reasons };
    }
    if (uiHints.some((token) => goal.includes(token)) || input.targetFiles.length <= 2) {
      reasons.push("The task looks like a focused UI, copy, CSS, or small-file change.");
      return { mode: policy === "best_result" ? "hybrid" : "webagent", policy, reasons };
    }
    reasons.push("Defaulting to WebAgent to save Codex quota.");
    return { mode: policy === "best_result" ? "hybrid" : "webagent", policy, reasons };
  }
}
