# ChatGPT Web-first Local Bridge

`gpt-codex-bridge` 是 ChatGPT 网页端主控 GPT 的本地 coding runtime 治理层。

主线架构：

```text
ChatGPT 网页端主控 GPT
  -> Custom MCP
  -> Local Bridge
  -> WebAgent / Codex / Hybrid / External
```

Bridge 提供本地执行层，不在本地调用模型。默认 Executor 是 `WebAgent`，也就是由 ChatGPT 网页端 GPT 通过 MCP 驱动本地项目检索、patch、审批和执行流程。

## 核心能力

- 项目 allowlist、文件读取、context index、`retrieve_context`
- Task / Task Branch 多对话管理
- Run/Event 时间线和 LogStore 审计日志
- Tool Registry 风险治理
- Patch preflight、安全报告、apply/revert backup
- Approval Policy: `read_only` / `manual_review` / `auto_review` / `full_access`
- 可选 `git_worktree` / `copy_workspace` 隔离模式
- WebAgent / Codex / Hybrid / External Executor Router
- Windows PowerShell 优先

## 快速启动

```powershell
cd .\bridge
npm.cmd install --no-audit --no-fund
npm.cmd run dev
```

打开：

```text
http://localhost:8787/dashboard/
```

ChatGPT Custom MCP 使用：

```text
https://your-domain/mcp
```

认证方式选择 Local pairing code，并从 Dashboard Setup 页复制本地 pairing code。

## 常用测试

```powershell
npm.cmd run build
npm.cmd run check
npm.cmd run test:events
npm.cmd run test:tool-registry
npm.cmd run test:patch-preflight
npm.cmd run mcp:smoke
```

## 文档

- [Runtime Events](./docs/runtime-events.md)
- [Tool Registry](./docs/tool-registry.md)
- [Task Branch Isolation](./docs/task-branch-isolation.md)
- [Patch Safety](./docs/patch-safety.md)
- [Executors](./docs/executors.md)
- [WebAgent Runtime](./docs/webagent-runtime.md)
- [Security Model](./docs/security-model.md)
- [Context Retrieval](./docs/context-retrieval.md)
- [Quickstart](./QUICKSTART.md)

