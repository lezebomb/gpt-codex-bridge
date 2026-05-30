# 快速启动

## 1. 启动本地 Bridge

PowerShell：

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge\bridge
npm.cmd install --no-audit --no-fund --cache .\.npm-cache
npm.cmd run dev
```

打开：

```text
http://localhost:8787/dashboard/
```

## 2. 在 dashboard 测试连接

进入“连接向导”，点击“测试连接”。成功时会显示：

```text
连接成功；运行模式：演练模式；权限模式：人工审查。
```

本地配对码会自动生成，不需要提前设置环境变量。

## 3. 选择项目

进入“项目”：

1. 点击常用位置或磁盘目录。
2. 进入目标文件夹。
3. 点击“选择当前文件夹”，或手动粘贴路径后点击“注册项目”。

示例项目：

```text
C:\Users\24981\Desktop\gpt-codex-bridge\examples\demo-project
```

## 4. 配置 ChatGPT Custom MCP

用 Cloudflare Tunnel 或 ngrok 暴露：

```text
http://localhost:8787 -> https://bridge.your-domain.com
```

ChatGPT 自定义 GPT 的 Custom MCP：

```text
Server URL: https://bridge.your-domain.com/mcp
Auth: Access token / API key
Value: dashboard 显示的本地配对码
```

## 5. 日常使用

在 ChatGPT 主控 GPT 里说：

```text
请读取当前项目结构。
请读取 src/App.tsx。
请创建一个小范围网页补丁。
请创建演练模式 Codex 任务做验证。
请读取最新错误日志并生成修复方案。
```

dashboard 只负责本地控制：连接、项目、任务、审批、日志、能力中心和高级设置。
