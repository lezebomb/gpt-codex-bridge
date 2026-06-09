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
  selectedExecutor: ExecutorMode;
  policy: ExecutorPolicy;
  reasons: string[];
  decisionReason: string;
  confidence: number;
  riskNotes: string[];
  suggestedIsolationMode: "in_place" | "git_worktree" | "copy_workspace";
  recommendedMode?: ExecutorMode;
  recommendedExecutor?: ExecutorMode;
  locked: boolean;
};

function result(input: Omit<ExecutorRoutingResult, "selectedExecutor" | "decisionReason" | "confidence" | "riskNotes" | "suggestedIsolationMode"> & Partial<Pick<ExecutorRoutingResult, "confidence" | "riskNotes" | "suggestedIsolationMode" | "recommendedExecutor">>): ExecutorRoutingResult {
  return {
    ...input,
    selectedExecutor: input.mode,
    decisionReason: input.reasons.join(" "),
    confidence: input.confidence ?? (input.locked ? 0.9 : 0.7),
    riskNotes: input.riskNotes || [],
    suggestedIsolationMode: input.suggestedIsolationMode || (input.mode === "webagent" ? "in_place" : "git_worktree"),
    recommendedExecutor: input.recommendedExecutor || input.recommendedMode
  };
}

function includesAny(goal: string, tokens: string[]) {
  return tokens.some((token) => goal.includes(token));
}

export class ExecutorRouter {
  route(input: ExecutorRoutingInput): ExecutorRoutingResult {
    const policy = input.requestedPolicy || "save_codex_quota";
    const goal = input.goal.toLowerCase();
    const targetCount = input.targetFiles.length;

    if (input.requestedMode) {
      return result({
        mode: input.requestedMode,
        policy,
        reasons: ["User explicitly selected an executor mode."],
        locked: true,
        riskNotes: input.requestedMode === "external" ? ["External executors should use git_worktree or copy_workspace isolation."] : []
      });
    }

    if (input.externalExecutorId) {
      return result({
        mode: "external",
        policy: "manual",
        reasons: ["An external executor id was provided."],
        locked: true,
        riskNotes: ["External executor access is high risk and should be reviewed."],
        suggestedIsolationMode: "git_worktree"
      });
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
      return result({
        mode: "codex",
        policy,
        reasons: ["The request explicitly asked for Codex."],
        locked: true,
        suggestedIsolationMode: "git_worktree"
      });
    }

    if (includesAny(goal, [
      "save quota",
      "save codex quota",
      "webagent",
      "chatgpt web",
      "网页端",
      "省额度"
    ])) {
      return result({
        mode: "webagent",
        policy,
        reasons: ["The request explicitly asked to stay in the web-driven quota-saving flow."],
        locked: true
      });
    }

    if (includesAny(goal, ["hybrid", "cross review", "交叉审查"])) {
      return result({
        mode: "hybrid",
        policy: input.requestedPolicy || "best_result",
        reasons: ["The request mentions a hybrid or cross-review flow."],
        locked: true,
        suggestedIsolationMode: "git_worktree"
      });
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
        return result({ mode: "codex", policy, reasons, locked: true, suggestedIsolationMode: "git_worktree" });
      }
      if (policy === "save_codex_quota") {
        reasons.push("Codex is recommended for depth, but the current policy keeps this task on WebAgent unless the user switches explicitly.");
        return result({
          mode: "webagent",
          recommendedMode: "codex",
          recommendedExecutor: "codex",
          policy,
          reasons,
          locked: true,
          confidence: 0.72,
          riskNotes: ["Complex task is kept on WebAgent to save quota; Codex remains recommended for depth."],
          suggestedIsolationMode: "git_worktree"
        });
      }
      return result({ mode: "codex", policy, reasons, locked: true, suggestedIsolationMode: "git_worktree" });
    }

    if (includesAny(goal, uiHints) || targetCount <= 2) {
      return result({
        mode: policy === "best_result" ? "hybrid" : "webagent",
        policy,
        reasons: ["The task looks like a focused UI, copy, CSS, or small-file change."],
        locked: true
      });
    }

    return result({
      mode: policy === "best_result" ? "hybrid" : "webagent",
      policy,
      reasons: ["Defaulting to WebAgent to save Codex quota."],
      locked: true
    });
  }
}
