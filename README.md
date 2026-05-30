# ChatGPT Custom MCP Bridge for Codex

中文名：ChatGPT-Codex 本地桥接器。

这个项目不是独立 IDE，也不是 VS Code 插件。它的主界面是 ChatGPT 网页端里的“主控 GPT”。本地 Bridge 负责把你电脑上的项目文件、网页补丁、Codex 任务、审批、日志、修复方案和受管 MCP 能力安全地交给主控 GPT 使用。

推荐工作流：

1. 在本机启动 Bridge。
2. 用 Cloudflare Tunnel 或 ngrok 把 `http://localhost:8787` 暴露成 HTTPS 子域名。
3. 在 ChatGPT 自定义 GPT 里添加 Custom MCP。
4. 服务器 URL 填：`https://你的子域名/mcp`。
5. 认证方式选“访问令牌 / API 密钥”，值填 dashboard 显示的“本地配对码”。
6. 日常在 ChatGPT 网页端对话；dashboard 只负责本地连接、项目选择、任务、审批、日志、能力中心和高级设置。

## Windows PowerShell 快速启动

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge\bridge
npm.cmd install --no-audit --no-fund --cache .\.npm-cache
npm.cmd run dev
```

打开：

```text
http://localhost:8787/dashboard/
```

默认端口是 `8787`。本地配对码会自动生成在 `bridge\data\runtime.json`，普通用户不需要手动改文件。需要更换时，在 dashboard 的“连接向导”点击“重新生成”。

## 一键安装到本机用户目录

从仓库根目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install.ps1
```

安装后从开始菜单启动：

```text
Start ChatGPT Codex Bridge
```

后续从 GitHub 安装时可以保留 `.git`，这样可以用更新脚本拉取新版：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install.ps1 `
  -SourceRepo "https://github.com/lezebomb/gpt-codex-bridge.git" `
  -Branch "main"
```

更新：

```powershell
powershell -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\ChatGPTCodexBridge\scripts\windows\update.ps1"
```

打包 GitHub Release zip：

```powershell
npm.cmd run release:zip
```

如果 npm 安装损坏：

```powershell
npm.cmd run repair-install
```

## 目录结构

```text
bridge/
  src/server.ts              # Express + REST + /mcp Streamable HTTP
  public/                    # 静态 dashboard
  scripts/                   # REST/MCP/UI smoke tests
  openapi/action-schema.yaml # 旧 OpenAPI Actions 兼容文件，主线不再依赖它
docs/                        # Windows、MCP、Cloudflare、安全和故障排查文档
examples/demo-project/       # 可安全测试 patch/job 的示例项目
gpts/project-orchestrator/   # 主控 GPT instructions 和知识清单
scripts/windows/             # 安装、启动、更新、卸载、修复脚本
```

## 已实现能力

- `/mcp` Streamable HTTP MCP Server，支持 ChatGPT Custom MCP。
- 本地配对码认证，推荐 `x-api-key: <code>`，并兼容 `Authorization: Bearer <code>`。
- 文件夹选择器：`/fs/roots`、`/fs/list`、`/projects/select`。
- 项目白名单、文件读取、目录树、上下文包。
- 网页补丁草稿、diff、apply、revert、reject、Codex review job。
- Codex jobs：`dry-run` 默认可用，`cli` 和 `app-server` 保留。
- 权限模式：`read_only`、`manual_review`、`auto_review`、`full_access`。
- 统一日志：`bridge\data\logs\YYYY-MM-DD.jsonl`。
- Repair Center：从错误创建修复方案，审批后创建 Codex repair job。
- Cross Review：最多 1 到 3 轮，必须给最终决策。
- MCP Center：展示内置/可用/未实现能力及风险。
- 默认中文 dashboard，支持中文 / English 切换。

## 安全说明

- Bridge 只读写已注册项目目录内的相对路径。
- 默认执行模式是 `dry-run`，不会真实调用 Codex 写文件。
- 默认权限模式是 `manual_review`，关键操作需要人工审批。
- `full_access` 必须输入 `I understand` 或 `我已理解风险`。
- 不接入 OpenAI 模型 API 做聊天，不额外产生模型 API 成本。
- 旧 OpenAPI schema 保留为兼容层；新主线是 ChatGPT Custom MCP。

## 常见问题

- `npm` 被 PowerShell 执行策略挡住：使用 `npm.cmd`。
- `unauthorized`：重新打开 dashboard 的连接向导，复制本地配对码到 ChatGPT Custom MCP。
- 端口占用：在启动前设置 `$env:BRIDGE_PORT = "8788"`，或关闭占用 8787 的旧进程。
- Codex CLI 不可用：先保持 `dry-run`；需要真实执行时安装并登录本机 `codex`。

详细教程见 [docs/windows-quickstart.md](docs/windows-quickstart.md) 和 [docs/chatgpt-custom-mcp-setup.md](docs/chatgpt-custom-mcp-setup.md)。
