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
  recommendedMode?: ExecutorMode;
  locked: boolean;
};

function includesAny(goal: string, tokens: string[]) {
  return tokens.some((token) => goal.includes(token));
}

export class ExecutorRouter {
  route(input: ExecutorRoutingInput): ExecutorRoutingResult {
    const policy = input.requestedPolicy || "save_codex_quota";
    const goal = input.goal.toLowerCase();
    const targetCount = input.targetFiles.length;

    if (input.requestedMode) {
      return {
        mode: input.requestedMode,
        policy,
        reasons: ["User explicitly selected an executor mode."],
        locked: true
      };
    }

    if (input.externalExecutorId) {
      return {
        mode: "external",
        policy: "manual",
        reasons: ["An external executor id was provided."],
        locked: true
      };
    }

    if (includesAny(goal, [
      "directly use codex",
      "please use codex",
      "use codex",
      "run codex",
      "直接用 codex",
      "直接让 codex",
      "请用 codex"
    ])) {
      return {
        mode: "codex",
        policy,
        reasons: ["The request explicitly asked for Codex."],
        locked: true
      };
    }

    if (includesAny(goal, [
      "save quota",
      "save codex quota",
      "webagent",
      "chatgpt web",
      "网页端",
      "省额度"
    ])) {
      return {
        mode: "webagent",
        policy,
        reasons: ["The request explicitly asked to stay in the web-driven quota-saving flow."],
        locked: true
      };
    }

    if (includesAny(goal, ["hybrid", "cross review", "交叉审查"])) {
      return {
        mode: "hybrid",
        policy: input.requestedPolicy || "best_result",
        reasons: ["The request mentions a hybrid or cross-review flow."],
        locked: true
      };
    }

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

    const uiHints = [
      "ui",
      "css",
      "copy",
      "wording",
      "component",
      "layout",
      "视觉",
      "样式",
      "文案",
      "组件"
    ];

    if (includesAny(goal, codexHints) || targetCount > 3) {
      const reasons = ["The task looks like a multi-file implementation, debugging, test-fix, or dependency-heavy job."];
      if (policy === "best_result") {
        return { mode: "codex", policy, reasons, locked: true };
      }
      if (policy === "save_codex_quota") {
        reasons.push("Codex is recommended for depth, but the current policy keeps this task on WebAgent unless the user switches explicitly.");
        return {
          mode: "webagent",
          recommendedMode: "codex",
          policy,
          reasons,
          locked: true
        };
      }
      return { mode: "codex", policy, reasons, locked: true };
    }

    if (includesAny(goal, uiHints) || targetCount <= 2) {
      return {
        mode: policy === "best_result" ? "hybrid" : "webagent",
        policy,
        reasons: ["The task looks like a focused UI, copy, CSS, or small-file change."],
        locked: true
      };
    }

    return {
      mode: policy === "best_result" ? "hybrid" : "webagent",
      policy,
      reasons: ["Defaulting to WebAgent to save Codex quota."],
      locked: true
    };
  }
}
