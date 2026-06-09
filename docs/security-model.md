# Security Model

Bridge 的安全模型以 Windows PowerShell 和本地项目 allowlist 为主线。

## Permission modes

- `read_only`: 只允许读取、索引、检索上下文。
- `manual_review`: 低风险准备动作可执行，副作用动作需要审批。
- `auto_review`: 自动允许 file_read、context_index、retrieve_context、patch_draft、shell_readonly。
- `full_access`: 允许执行，但记录 audit warning。

## 需要审批的 action

- `patch_apply`
- `patch_revert`
- `shell_write`
- `dependency_install`
- `git_write`
- `network_access`
- `external_executor`
- `worktree_create`
- `workspace_delete`

## 审计与时间线

- LogStore 是审计日志，支持 `requestId`、`runId`、`taskBranchId` 过滤。
- EventStore 是结构化 Agent Run 时间线。
- Tool Registry 为每个 MCP tool 标注 riskLevel 和 sideEffects。

