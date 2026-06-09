import { RuntimeEventType } from "../../types.js";

export const RUNTIME_EVENT_TYPES: RuntimeEventType[] = [
  "run.created",
  "run.started",
  "tool.called",
  "tool.completed",
  "tool.failed",
  "context.indexed",
  "context.retrieved",
  "patch.proposed",
  "patch.preflight_checked",
  "patch.applied",
  "patch.reverted",
  "approval.required",
  "approval.granted",
  "approval.rejected",
  "shell.started",
  "shell.completed",
  "shell.failed",
  "executor.selected",
  "executor.started",
  "executor.completed",
  "executor.failed",
  "repair.proposed",
  "conflict.detected",
  "run.cancelled"
];

