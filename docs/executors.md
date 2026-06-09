# Executors

Bridge 统一抽象四类 Executor：WebAgent、Codex、Hybrid、External。

每个 Executor 暴露：`id`、`name`、`description`、`capabilities`、`riskLevel`、`supportsCancel`、`supportsDryRun`、`supportsStreaming`、`supportsWorkspaceIsolation`。

## WebAgent

默认 executor。ChatGPT 网页端 GPT 通过 MCP 驱动本地 runtime，适合上下文检索、小 patch、审批流和修复提案。

## Codex

保留原生能力，适合多文件实现、测试、复杂 bug、集成和修复。高风险任务建议使用 `git_worktree`。

## Hybrid

明确分阶段：

1. `webagent_plan`
2. `codex_review_or_execute`
3. `final_review`

## External

配置化第三方 CLI 执行器。Bridge 不硬编码 DeepSeek、cc-Switch 或任何供应商。External 默认应使用 `git_worktree` 或 `copy_workspace`。

`create_execution_job` 会生成 `runId`，所有 executor 输出都会写入 EventStore 和 LogStore。

