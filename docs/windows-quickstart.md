# Windows Quickstart

## 启动

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge\bridge
npm.cmd install --no-audit --no-fund
npm.cmd run dev
```

打开：

```text
http://localhost:8787/dashboard/
```

## 重要说明

- PowerShell 优先使用 `npm.cmd`
- 主界面是 ChatGPT 网页端，不是本地 Dashboard
- Dashboard 只负责本地桥接、审批和诊断

## 检查

```powershell
npm.cmd run build
npm.cmd run smoke
npm.cmd run mcp:smoke
```
