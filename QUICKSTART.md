# Quickstart

## 1. 启动 Local Bridge

要求 `Node.js >= 24`，Windows 用户默认使用 Windows PowerShell。

```powershell
node -v
cd .\bridge
npm.cmd install --no-audit --no-fund
npm.cmd run dev
```

打开 Dashboard：

```text
http://localhost:8787/dashboard/
```

## 2. 配置 ChatGPT Custom MCP

1. 用 Cloudflare Tunnel 或其他 HTTPS tunnel 暴露 `http://localhost:8787`。
2. 在 ChatGPT Custom MCP 填入 `https://your-domain/mcp`。
3. 认证方式选择 `Local pairing code`。
4. 填入 Dashboard Setup 页展示的本地 pairing code。

## 3. 推荐对话起手式

1. `get_bridge_status`
2. `list_projects`
3. `list_tasks`
4. `list_task_branches`
5. 继续任务时调用 `get_task_branch` 和 `continue_task_branch`

每个网页端对话必须绑定一个 `taskBranchId`。不要假设不同网页端对话共享上下文。

## 4. 默认工作流

```text
retrieve_context
-> propose_web_patch
-> get_patch_diff
-> preflight_patch_apply
-> request_apply_patch
-> get_run_events
```

高风险工具先查看 `get_tool_registry` 或 `explain_tool_risk`。

## 5. 本地验证

```powershell
npm.cmd run build
npm.cmd run check
npm.cmd run test:bootstrap
npm.cmd run test:executor-router
npm.cmd run test:webagent-continue
npm.cmd run test:context-index
npm.cmd run test:fts-queries
npm.cmd run test:patch-conflicts
npm.cmd run test:context-budget
npm.cmd run test:events
npm.cmd run test:tool-registry
npm.cmd run test:task-branch-isolation
npm.cmd run test:patch-preflight
npm.cmd run test:executor-cancel
npm.cmd run test:approval-policy
npm.cmd run test:docs
npm.cmd run mcp:smoke
```

