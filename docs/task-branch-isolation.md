# Task Branch Isolation

Task Branch 不等于 Git branch。Task Branch 是 Bridge 的对话/任务分支状态；它可以选择关联 `gitBranchName` 和隔离工作区。

## Isolation modes

- `in_place`: 默认。直接在项目目录运行，依赖 patch preflight 和 backup。
- `git_worktree`: 高级安全模式。适合 Codex、Hybrid、External 或多文件高风险任务。
- `copy_workspace`: 非 Git repo 或不适合 worktree 时的 fallback。

默认不会为所有任务创建 worktree。

## MCP tools

- `recommend_isolation_mode`
- `create_task_worktree`
- `get_task_worktree_status`
- `cleanup_task_worktree`

Windows PowerShell 是主线。`git_worktree` 需要项目本身是 Git repo；不是 Git repo 时 Bridge 会建议 `copy_workspace` 或 `in_place`。

