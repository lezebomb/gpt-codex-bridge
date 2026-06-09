# Tool Registry

Tool Registry 集中描述每个 MCP tool 的治理信息：

- `name`
- `category`
- `description`
- `riskLevel`: `low` / `medium` / `high` / `critical`
- `sideEffects`: `none` / `read` / `write` / `shell` / `network` / `git` / `external`
- `requiresApproval`
- `allowedPermissionModes`
- `recommendedExecutorModes`
- `inputSummary` / `outputSummary`
- `examples`

## MCP tools

- `get_tool_registry`
- `get_tool_policy`
- `explain_tool_risk`

主控 GPT 在调用 `request_apply_patch`、`run_shell_command`、`create_execution_job`、worktree 相关工具前，应先参考 Tool Registry。

Dashboard 的 MCP Center 会显示每个 tool 的 riskLevel、sideEffects 和 requiresApproval。

