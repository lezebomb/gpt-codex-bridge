# 排错指南

本页优先给 Windows PowerShell 解决方案。

## 控制台显示认证失败

现在不需要在启动前手动设置 `BRIDGE_TOKEN`。首次打开控制台时，页面会从本机 Bridge 自动读取访问令牌并保存到浏览器 localStorage。

如果仍然看到认证失败：

1. 进入“设置”。
2. 点击“重新读取本机配置”。
3. 点击“测试连接”。

如果还失败，可以点击“重新生成令牌”。这会让旧浏览器页面和旧请求失效，但当前页面会自动更新为新令牌。

## 服务地址错误或服务没启动

页面会显示：

```text
连接失败：无法访问本机服务。请确认 npm.cmd run dev 正在运行，端口是否正确。
```

确认服务：

```powershell
Invoke-RestMethod -Uri http://localhost:8787/health
```

如果你换到了 `8788`：

```powershell
Invoke-RestMethod -Uri http://localhost:8788/health
```

## 根目录执行 dev 失败

根目录已经有转发脚本。先安装依赖：

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge
npm.cmd install --no-audit --no-fund
npm.cmd run dev
```

也可以进入 `bridge` 目录直接启动：

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge\bridge
npm.cmd run dev
```

## npm install 失败

先确认 Node.js 和 npm：

```powershell
node --version
npm --version
```

如果 PowerShell 拦截 `npm.ps1`，使用：

```powershell
npm.cmd install --no-audit --no-fund
```

如果依赖或缓存损坏：

```powershell
npm.cmd run repair-install
```

如果你之前通过这些命令能修好，也可以使用等价修复脚本：

```powershell
.\scripts\windows\repair-install.ps1 -RemoveLock
```

它会清理 npm cache、删除 `node_modules`，并可选删除 lock 文件后重新安装 `bridge` 依赖。

## 程序完全打不开

1. 在仓库根目录运行：

```powershell
npm.cmd run repair-install
```

2. 再尝试启动：

```powershell
npm.cmd run dev
```

3. 如果是安装版，运行：

```powershell
powershell -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\ChatGPTCodexBridge\scripts\windows\start-bridge.ps1" -Foreground
```

这样可以在当前窗口看到启动日志。

## 端口占用

如果 `8787` 已被其他程序占用：

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge
$env:BRIDGE_PORT = "8788"
npm.cmd run dev
```

打开：

```text
http://localhost:8788/dashboard/
```

## 令牌不匹配

普通用户不需要手动处理令牌。推荐做法：

1. 进入“设置”。
2. 点击“重新读取本机配置”。
3. 如果仍失败，点击“重新生成令牌”。

令牌文件只作为本机持久化存储，不需要手动对照：

```text
bridge\data\runtime.json
```

## PowerShell curl alias 问题

PowerShell 中 `curl` 常常是 `Invoke-WebRequest` 的别名，不等于 Linux/macOS curl。建议直接使用：

```powershell
Invoke-RestMethod -Uri http://localhost:8787/health

$bootstrap = Invoke-RestMethod -Uri http://localhost:8787/bootstrap
Invoke-RestMethod `
  -Uri http://localhost:8787/config `
  -Headers @{ Authorization = "Bearer $($bootstrap.token)" }
```

## 路径包含中文或空格

注册项目时可以直接填写 Windows 路径，例如：

```text
C:\Users\24981\Desktop\我的 项目\demo-project
```

读取文件时必须使用项目内相对路径，例如：

```text
src/App.tsx
```

不要填绝对文件路径。后端会拒绝路径穿越和被忽略目录。

## Codex 命令不可用

先在“设置”中选择“演练模式”，它始终可用。

如果要用“命令行模式”，确认本机 Codex 可用：

```powershell
codex --version
```

命令行模式跟随本机当前 Codex 登录状态。本工具不管理账号切换。

## 网页补丁应用被阻止

查看“权限模式”：

- 只读检查：阻止应用和回滚。
- 人工审查：确认后可应用/回滚。
- 自动审查：低风险任务可自动运行，高风险仍需审批。
- 完全访问：危险模式，需要输入确认文本。

如果按钮不能执行，页面会显示阻止原因。

## 修复中心怎么用

当 API 调用失败时，错误面板会显示：

- 接口
- HTTP 状态码
- 请求编号
- 错误详情

进入“修复中心”：

1. 点击“读取最新错误”。
2. 点击“从最新错误生成草案”。
3. 审查诊断、方案和执行计划。
4. 点击“创建修复方案”。
5. 用户批准后才会创建或运行修复任务。

演练模式不会真实调用 Codex 修改文件。
