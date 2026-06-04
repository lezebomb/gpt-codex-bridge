# Windows Quickstart

## 启动

Windows 用户默认走 Windows PowerShell 路径。

先检查 Node 版本：

```powershell
node -v
```

当前项目要求 `Node.js >= 24`，推荐安装最新稳定版。

```powershell
cd .\bridge
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
- 如在 macOS/Linux 运行，部分 PowerShell-only smoke 可跳过，或改用 bash fallback

## 检查

```powershell
npm.cmd run build
npm.cmd run check
npm.cmd run smoke
npm.cmd run mcp:smoke
```
