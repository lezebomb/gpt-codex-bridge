# Quickstart

## 1. 启动本地 Bridge

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge\bridge
npm.cmd install --no-audit --no-fund
npm.cmd run dev
```

打开：

```text
http://localhost:8787/dashboard/
```

## 2. 记住角色分工

- ChatGPT 网页端主控 GPT：主界面，负责对话、规划、调用 MCP
- 本地 Bridge：负责项目读写、任务、审批、日志、执行器
- VS Code：用户自己看代码，不是产品主线

## 3. 配置 ChatGPT Custom MCP

1. 用 Cloudflare Tunnel 暴露 `http://localhost:8787`
2. 在 ChatGPT Custom MCP 填入 `https://your-domain/mcp`
3. 认证方式选择 `Access token / API key`
4. 值填写 Dashboard Setup 页展示的本地配对码

## 4. 推荐的对话起手式

1. `get_bridge_status`
2. `list_projects`
3. 没项目就 `browse_folders` + `select_project`
4. `inspect_project`
5. `create_task`
6. 按任务情况选择：
   `WebAgent` 适合小 UI / 文案 / CSS / 单文件改动
   `Codex` 适合多文件重构 / 测试修复 / 复杂 bug
   `Hybrid` 适合草稿 + 验证
   `External` 目前是 dry-run/stub

## 5. 本地检查

```powershell
npm.cmd run build
npm.cmd run smoke
npm.cmd run mcp:smoke
```
