# ChatGPT Web-first Local Bridge

这是一个 ChatGPT Web-first 的本地编程代理桥接器。

主界面不是这个仓库里的 Dashboard，也不是 VS Code 插件。主工作台是 ChatGPT 网页端里的主控 GPT。`bridge/` 负责本地工具层，包括：

- 注册和检查本地项目
- 生成上下文包、补丁草稿、diff、apply/revert
- 维护 `projectId` / `taskId` / `taskBranchId` / `execution job`
- 路由到 `WebAgent` / `Codex` / `Hybrid` / `External`
- 统一日志、审批、Repair Center、MCP Plugin Center

默认 Executor 是 `WebAgent`，目标是节省 Codex 额度。`Codex` 保留为完整原生执行器，`Hybrid` 用于草稿加验证，`External` 当前只提供 dry-run/stub 预留。

## Node 版本要求

- 当前项目要求 `Node.js >= 24`
- 推荐直接安装 Node.js 最新稳定版
- 因为项目使用了 `node:sqlite`，旧版本 Node 可能无法运行
- 启动前先执行 `node -v`
- Windows 用户默认使用 Windows PowerShell

## 使用路径

1. 本地启动 Bridge
2. 用 Cloudflare Tunnel 暴露 `http://localhost:8787`
3. 在 ChatGPT 自定义 MCP 中填入 `https://your-domain/mcp`
4. 使用 `本地配对码 / Local pairing code`
5. 在 ChatGPT 网页端里围绕 `projectId` / `taskId` / `taskBranchId` 完成工作

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

然后查看：

- [Quickstart](./QUICKSTART.md)
- [Windows 快速启动](./docs/windows-quickstart.md)
- [ChatGPT 自定义 MCP 设置](./docs/chatgpt-custom-mcp-setup.md)
- [MCP tools 参考](./docs/mcp-tools-reference.md)

## 常用命令

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run check
npm.cmd run smoke
npm.cmd run mcp:smoke
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
