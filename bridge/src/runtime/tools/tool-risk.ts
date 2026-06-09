import { ToolRiskLevel, ToolSideEffect } from "../../types.js";

const RANK: Record<ToolRiskLevel, number> = { low: 1, medium: 2, high: 3, critical: 4 };

export function riskAtLeast(value: ToolRiskLevel, minimum: ToolRiskLevel): boolean {
  return RANK[value] >= RANK[minimum];
}

export function summarizeSideEffects(sideEffects: ToolSideEffect[]): string {
  if (!sideEffects.length || sideEffects.includes("none")) return "No local side effects.";
  return sideEffects.map((effect) => {
    if (effect === "read") return "reads project/runtime data";
    if (effect === "write") return "writes project/runtime data";
    if (effect === "shell") return "may spawn a local shell process";
    if (effect === "network") return "may use network access";
    if (effect === "git") return "may modify Git state";
    if (effect === "external") return "may call an external executor";
    return effect;
  }).join(", ");
}

