# Bridge Runtime

`bridge/` 是本地服务端和本地控制面板。

## 启动

```powershell
npm.cmd install --no-audit --no-fund
npm.cmd run dev
```

默认地址：

```text
http://localhost:8787/dashboard/
http://localhost:8787/mcp
```

## 本地配对码

- 用户侧统一名称：`本地配对码 / Local pairing code`
- 环境变量优先级：`BRIDGE_PAIRING_CODE` -> `BRIDGE_TOKEN` -> 自动生成
- Dashboard Setup 页和 `get_setup_guide` 都应只向用户展示 “Local pairing code”
- `/bootstrap` 只允许明确本地 Host 访问：`localhost`、`127.0.0.1`、`[::1]`

运行时文件：

```text
bridge/data/runtime.json
```

## v2 双执行器重点

- 任务创建时只做一次执行器决策，并锁定到任务与默认分支
- `save_codex_quota` 会推荐复杂任务考虑 Codex，但默认仍保留在 WebAgent
- 每个任务默认创建一个 `taskBranch`
- 多个 ChatGPT 对话应分别绑定 `taskBranchId`
- 继续任务前优先 `get_task`、`list_task_branches`、`continue_task_branch`
- 上下文默认走 `retrieve_context`，只返回精简片段和下一步建议
- `create_context_pack` 默认控 token，除非显式要求 `explicitFullRead`

## 主要目录

```text
bridge/src/
  bridge-service.ts
  mcp-server.ts
  server.ts
  runtime/context/
  runtime/webagent/
  executors/
bridge/public/
bridge/scripts/
bridge/config/external-executors.json
```

## 常用检查

```powershell
npm.cmd run build
node --check public/app.js
npm.cmd run check:public
npm.cmd run smoke
npm.cmd run mcp:smoke
npm.cmd run test:bootstrap
npm.cmd run test:context-index
npm.cmd run test:executor-router
npm.cmd run test:webagent-continue
```

`ui:smoke` 和 `check:public` 需要本机能启动浏览器。
