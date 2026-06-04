# ChatGPT Web-first Local Bridge

这是一个 ChatGPT Web-first 的本地编程代理桥接器。

主界面不是本仓库里的 Dashboard，也不是 VS Code 插件。主界面是 ChatGPT 网页端里的主控 GPT。`bridge/` 负责本地工具层，包括：

- 注册和检查本地项目
- 生成上下文包、补丁草稿、diff、apply/revert
- 维护 `projectId` / `taskId` / `execution job`
- 路由到 `WebAgent` / `Codex` / `Hybrid` / `External`
- 统一日志、审批、Repair Center、MCP Plugin Center

默认执行器是 `WebAgent`，目标是节省 Codex 额度。`Codex` 保留为完整原生执行器，`Hybrid` 用于小补丁加集成验证，`External` 目前只提供 dry-run/stub 配置预留。

这个项目不需要 OpenAI API 聊天模型。用户的日常入口是：

1. 本地启动 Bridge
2. 用 Cloudflare Tunnel 暴露 `http://localhost:8787`
3. 在 ChatGPT 自定义 MCP 中填入 `https://your-domain/mcp`
4. 使用本地配对码作为 Access token / API key
5. 在 ChatGPT 网页端里围绕 `projectId` / `taskId` 完成工作

## 架构

```text
ChatGPT 主控 GPT
  -> Custom MCP connector
  -> Bridge MCP Server (/mcp)
  -> Executor Router
     -> WebAgent Executor
     -> Codex Executor
     -> Hybrid Executor
     -> External Executor
```

## 主要能力

- 真正的 `/mcp` Streamable HTTP endpoint，基于 `@modelcontextprotocol/sdk`
- 项目白名单、文件夹浏览器、项目检查、文件读取
- Task 模型：`create_task` / `list_tasks` / `get_task` / `continue_task`
- 执行器模型：`create_execution_job` / `get_execution_job`
- Web patch 草稿、diff、apply、revert
- Shell command 请求、分类、超时、stdout/stderr 捕获
- 统一 JSONL 日志：`bridge/data/logs/YYYY-MM-DD.jsonl`
- Repair proposal 与 bounded cross review
- 中文默认、可切英文的本地控制面板

## 快速启动

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge\bridge
npm.cmd install --no-audit --no-fund
npm.cmd run dev
```

打开：

```text
http://localhost:8787/dashboard/
```

然后查看：

- [QUICKSTART.md](/C:/Users/24981/Desktop/gpt-codex-bridge/QUICKSTART.md)
- [docs/windows-quickstart.md](/C:/Users/24981/Desktop/gpt-codex-bridge/docs/windows-quickstart.md)
- [docs/chatgpt-custom-mcp-setup.md](/C:/Users/24981/Desktop/gpt-codex-bridge/docs/chatgpt-custom-mcp-setup.md)
- [docs/mcp-tools-reference.md](/C:/Users/24981/Desktop/gpt-codex-bridge/docs/mcp-tools-reference.md)

## 常用命令

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run smoke
npm.cmd run mcp:smoke
npm.cmd run ui:smoke
```

## 目录

```text
bridge/
  config/external-executors.json
  public/
  scripts/
  src/
docs/
gpts/project-orchestrator/
examples/demo-project/
roles/
```

## 旧能力保留说明

v2 不是把旧功能删光，而是把旧功能重新挂回新的主线。保留下来的核心能力包括：

- 项目文件访问
- patch / diff / apply / revert
- git status / git diff
- dry-run / cli / app-server Codex 执行路径
- logs / repair proposal / cross review
- Dashboard 本地审批与控制

旧 `bridge/openapi/action-schema.yaml` 只作为 legacy 兼容文件保留，不再是主线入口。
