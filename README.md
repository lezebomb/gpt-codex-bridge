# ChatGPT Web x Codex Bridge

这是一个运行在本机的工作流桥接工具：浏览器控制台负责管理项目、文件、网页补丁、差异、执行任务、日志和修复流程；后端只监听本机地址，负责安全地读取/写入已注册项目。

默认打开地址：

```text
http://localhost:8787/dashboard/
```

## Windows PowerShell 快速启动

在仓库根目录打开 PowerShell：

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge
npm.cmd install --no-audit --no-fund
npm.cmd run dev
```

然后打开：

```text
http://localhost:8787/dashboard/
```

首次打开时，控制台会自动读取本机服务地址和访问令牌。你不需要提前设置环境变量，也不需要手动复制 token。进入“设置”点击“测试连接”，成功后即可在界面里选择执行模式和权限模式。

## 默认配置

- 默认端口：`8787`
- 默认权限模式：`manual_review`，界面显示为“人工审查”
- 默认执行模式：`dry-run`，界面显示为“演练模式”
- 访问令牌：首次启动自动生成，保存在本机 `bridge\data\runtime.json`
- 令牌更换：在“设置”里点击“重新生成令牌”

## 目录结构

```text
bridge/                  # Bridge 后端和静态 dashboard
bridge/src/server.ts      # 后端入口
bridge/public/            # 前端：index.html、app.js、styles.css
bridge/openapi/           # ChatGPT Action schema
bridge/scripts/           # Node/Playwright smoke tests
docs/                     # Windows 启动、安装、UI、排错和使用教程
examples/demo-project/    # 可安全测试补丁应用/回滚的演示项目
roles/                    # ChatGPT 角色协议
.agents/skills/           # Codex 本地技能
scripts/windows/          # Windows 安装、启动、更新、修复脚本
```

## 主要功能

- 默认中文控制台，并支持中文 / English 切换。
- 可展开/收起侧边栏，主内容区优先展示工作内容。
- 设置页自动读取本机服务地址和访问令牌，可测试连接、选择执行模式、选择权限模式、重新生成令牌。
- 项目注册、文件树、文件读取、上下文包。
- 网页补丁创建、差异查看、应用、回滚、创建审查任务。
- 执行任务：演练模式、命令行模式、应用服务模式。
- 权限模式：只读检查、人工审查、自动审查、完全访问。
- 日志、诊断、修复中心。
- 有上限的交叉审查，避免 ChatGPT Web 与 Codex 无限互审。
- Git / GitHub CLI 辅助操作。

## 安全说明

Bridge 默认只监听 `127.0.0.1`。除 `/health` 和本机 `/bootstrap` 外，敏感接口都需要访问令牌。控制台会自动拿到本机令牌并给后续请求加上认证头。

建议真实项目使用“人工审查”。“完全访问”是危险模式，界面会要求输入“我已理解风险”才允许开启。

只有注册过的项目根目录可以读写；后端会拒绝路径穿越和 `.git`、`node_modules`、`dist`、`build`、`.next`、`coverage` 等目录。

## 常用检查

在仓库根目录运行：

```powershell
npm.cmd run check:public
npm.cmd run build
npm.cmd run smoke
```

浏览器 UI 冒烟测试需要保持 Bridge 正在运行：

```powershell
npm.cmd run ui:smoke
```

## 安装成 Windows 程序

如果希望像普通本地程序一样安装、从开始菜单启动，并为后续 GitHub 更新做准备：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install.ps1
```

安装位置默认是：

```text
%LOCALAPPDATA%\ChatGPTCodexBridge
```

安装后会创建开始菜单快捷方式：

- Start ChatGPT Codex Bridge
- Update ChatGPT Codex Bridge
- Open Dashboard

发布到 GitHub 后，推荐用 GitHub 仓库地址安装，这样更新器可以直接拉取新版本：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install.ps1 `
  -SourceRepo "https://github.com/OWNER/REPO.git" `
  -Branch "main"
```

更新：

```powershell
powershell -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\ChatGPTCodexBridge\scripts\windows\update.ps1"
```

## 常见问题

- 程序打不开：先在仓库根目录运行 `npm.cmd run repair-install`，再运行 `npm.cmd run dev`。
- 看到认证失败：进入“设置”，点击“重新读取本机配置”，再点击“测试连接”。
- 端口占用：用 `$env:BRIDGE_PORT = "8788"` 临时换端口，然后运行 `npm.cmd run dev`。
- PowerShell 的 `curl` 是别名：调用 API 时优先用 `Invoke-RestMethod`。
- Codex 命令不可用：先使用“演练模式”；命令行模式需要本机 `codex` 已安装并登录。

完整教程见 [docs/full-usage-tutorial-zh.md](docs/full-usage-tutorial-zh.md)，Windows 快速启动见 [docs/windows-quickstart.md](docs/windows-quickstart.md)，安装更新见 [docs/windows-installer.md](docs/windows-installer.md)，排错见 [docs/troubleshooting.md](docs/troubleshooting.md)。
