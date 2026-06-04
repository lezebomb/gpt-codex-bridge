# 架构

## 目标工作流

```text
ChatGPT 网页端主控 GPT
  -> 自定义 MCP
  -> 本地 Bridge MCP Server
  -> 已注册本地项目 / Codex CLI / Codex App Server / 日志 / 审批
  -> diff、测试结果、截图、修复方案
  -> 回到 ChatGPT 主控 GPT 给用户决策
```

## 组件

### 1. 主控 GPT

负责需求澄清、项目选择、任务拆分、调用 MCP tools、审查结果和向用户解释下一步。

### 2. 本地 Bridge

Node/Express 服务，默认端口 `8787`。它同时提供：

- `/mcp`：ChatGPT 自定义 MCP 主入口。
- REST API：dashboard、兼容层和本机调试使用。
- dashboard：本地连接向导、项目选择、审批、日志、能力中心。

### 3. 项目白名单

Bridge 只读写已注册项目目录内的相对路径。文件读取、补丁、Codex 任务都必须绑定项目。

### 4. 权限模式

- `read_only`：只读检查。
- `manual_review`：保守模式，关键动作人工确认。
- `auto_review`：默认模式，低风险任务可自动运行。
- `full_access`：危险模式，必须显式输入确认语。

### 5. Codex 执行

- `dry-run`：默认可用，不真实执行 Codex。
- `cli`：调用本机 `codex` 命令。
- `app-server`：保留对 Codex App Server 的集成入口。

## 兼容层

`bridge\openapi\action-schema.yaml` 保留作 legacy OpenAPI Actions 兼容文件。新主线是自定义 MCP。
