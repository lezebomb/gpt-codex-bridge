# Quickstart

## 1. 启动本地 Bridge

先检查 Node 版本：

```powershell
node -v
```

当前项目要求 `Node.js >= 24`，推荐直接使用最新稳定版。

```powershell
cd .\bridge
npm.cmd install --no-audit --no-fund
npm.cmd run dev
```

打开：

```text
http://localhost:8787/dashboard/
```

## 2. 记住角色分工

- ChatGPT 网页端主控 GPT：主界面，负责对话、规划、调用 MCP
- 本地 Bridge：负责项目读写、任务、审批、日志、Executor
- VS Code：用户自己看代码，不是产品主线

## 3. 配置 ChatGPT Custom MCP

1. 用 Cloudflare Tunnel 暴露 `http://localhost:8787`
2. 在 ChatGPT Custom MCP 填入 `https://your-domain/mcp`
3. 认证方式选择 `Local pairing code`
4. 值填写 Dashboard Setup 页展示的本地配对码

## 4. 推荐的对话起手式

1. `get_bridge_status`
2. `list_projects`
3. 没项目就 `browse_folders` + `select_project`
4. `inspect_project`
5. `create_task`
6. 如需继续旧任务，先 `get_task` / `list_task_branches`，再绑定 `taskBranchId`

## 5. 本地检查

```powershell
npm.cmd run build
npm.cmd run check
npm.cmd run smoke
npm.cmd run mcp:smoke
```
