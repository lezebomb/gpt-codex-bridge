# 故障排查

## unauthorized / 认证失败

现象：ChatGPT Custom MCP 或 dashboard 请求返回 401。

处理：

1. 打开 `http://localhost:8787/dashboard/`。
2. 进入“连接向导”。
3. 点击“测试连接”。
4. 复制“本地配对码”。
5. 在 ChatGPT Custom MCP 的访问令牌 / API 密钥中填同一个值。

如怀疑泄露，点击“重新生成”。

## npm install 失败

PowerShell 中优先用：

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge\bridge
npm.cmd install --no-audit --no-fund --cache .\.npm-cache
```

如果损坏严重：

```powershell
npm.cmd run repair-install
```

或：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\repair-install.ps1 -RemoveLock
```

## npm run dev 找不到

后端在 `bridge` 目录。请执行：

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge\bridge
npm.cmd run dev
```

## PowerShell 报 npm.ps1 被禁止

使用 `npm.cmd`，不要用裸 `npm`：

```powershell
npm.cmd install --no-audit --no-fund
npm.cmd run dev
```

## 端口占用

默认端口是 8787。换端口：

```powershell
$env:BRIDGE_PORT = "8788"
npm.cmd run dev
```

## token 不匹配

UI 中叫“本地配对码”。旧文档里出现的 Bearer token 指的也是同一个配对码。推荐用 `x-api-key`：

```http
x-api-key: <本地配对码>
```

## PowerShell curl alias 问题

PowerShell 的 `curl` 可能是 `Invoke-WebRequest` 别名。推荐：

```powershell
Invoke-RestMethod http://localhost:8787/health
```

带配对码：

```powershell
$code = "从 dashboard 复制的本地配对码"
Invoke-RestMethod http://localhost:8787/config -Headers @{ "x-api-key" = $code }
```

## 路径包含中文或空格

使用引号：

```powershell
cd "C:\Users\24981\Desktop\gpt-codex-bridge\bridge"
```

项目路径建议通过 dashboard 文件夹选择器选择，不要手动输入。

## Codex 命令不可用

先保持执行模式为 `dry-run`。需要真实 CLI 时：

```powershell
codex --version
```

如果找不到命令，先安装并登录本机 Codex。Bridge 不管理账号切换，只跟随当前本机登录状态。

## dashboard 打不开

1. 确认服务窗口还在运行。
2. 打开：`http://localhost:8787/health`。
3. 查看启动日志：`bridge\data\logs`。
4. 用修复脚本重装依赖。
