# 日志与诊断

日志页面可以查看最近操作，按级别筛选，并按请求编号搜索。

## 在控制台查看

1. 打开“日志”。
2. 点击“刷新”。
3. 选择“信息 / 警告 / 错误”筛选。
4. 在搜索框输入请求编号或关键字。
5. 需要分享时点击“复制日志”。

## PowerShell API

先获取本机令牌：

```powershell
$bootstrap = Invoke-RestMethod -Uri http://localhost:8787/bootstrap
```

读取最近日志：

```powershell
Invoke-RestMethod `
  -Uri http://localhost:8787/logs `
  -Headers @{ Authorization = "Bearer $($bootstrap.token)" }
```

只看错误：

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:8787/logs?level=error" `
  -Headers @{ Authorization = "Bearer $($bootstrap.token)" }
```

读取诊断：

```powershell
Invoke-RestMethod `
  -Uri http://localhost:8787/diagnostics `
  -Headers @{ Authorization = "Bearer $($bootstrap.token)" }
```

读取最新错误：

```powershell
Invoke-RestMethod `
  -Uri http://localhost:8787/errors/latest `
  -Headers @{ Authorization = "Bearer $($bootstrap.token)" }
```

## 日志位置

默认在：

```text
bridge\data\logs
```

安装版在：

```text
%LOCALAPPDATA%\ChatGPTCodexBridge\bridge\data\logs
```

## 和修复中心配合

API 失败时，错误面板会显示请求编号。复制请求编号后：

1. 打开“日志”搜索请求编号。
2. 打开“修复中心”读取最新错误。
3. 生成修复草案。
4. 用户批准后创建修复任务。
