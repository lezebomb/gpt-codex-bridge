# Runtime Events

Bridge 现在把每次 Agent Run 写成结构化时间线，数据位于 `bridge/data/events`。

## Run

一次 `continue_task_branch`、`retrieve_context`、patch apply、shell command、execution job 都会产生或关联 `runId`。

Run 状态：`queued`、`running`、`waiting_for_approval`、`waiting_for_user`、`completed`、`failed`、`cancelled`。

## Events

常见事件包括：

- `run.created` / `run.started` / `run.cancelled`
- `tool.called` / `tool.completed` / `tool.failed`
- `context.indexed` / `context.retrieved`
- `patch.proposed` / `patch.preflight_checked` / `patch.applied` / `patch.reverted`
- `approval.required` / `approval.granted` / `approval.rejected`
- `shell.started` / `shell.completed` / `shell.failed`
- `executor.selected` / `executor.started` / `executor.completed` / `executor.failed`
- `repair.proposed` / `conflict.detected`

## MCP tools

- `list_runs`
- `get_run`
- `get_run_events`
- `cancel_run`

`LogStore` 仍然是审计日志；`EventStore` 是 Agent Runtime 时间线。

