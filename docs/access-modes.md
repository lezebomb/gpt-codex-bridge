# 权限模式

控制台提供四种权限模式，可在“设置”或“权限模式”页面中切换。

| 界面名称 | 内部值 | 适用场景 | 行为 |
| --- | --- | --- | --- |
| 只读检查 | `read_only` | 只想看项目、读文件、看日志 | 阻止应用/回滚补丁，阻止危险执行 |
| 人工审查 | `manual_review` | 推荐默认模式 | 关键动作都需要人工确认 |
| 自动审查 | `auto_review` | 低风险重复任务 | 低风险任务可自动运行，高风险仍需审批 |
| 完全访问 | `full_access` | 一次性分支、演示项目 | 放宽限制，危险；开启前必须输入“我已理解风险” |

真实项目建议使用“人工审查”。

## 在界面中切换

1. 打开 dashboard。
2. 进入“设置”或“权限模式”。
3. 选择目标模式。
4. 点击“保存设置”或模式卡片。

完全访问需要输入：

```text
我已理解风险
```

## 用 PowerShell API 切换

先从本机 bootstrap 获取当前令牌：

```powershell
$bootstrap = Invoke-RestMethod -Uri http://localhost:8787/bootstrap
```

切换到人工审查：

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8787/config/access-mode `
  -Headers @{ Authorization = "Bearer $($bootstrap.token)" } `
  -ContentType "application/json" `
  -Body '{"permissionMode":"manual_review"}'
```

切换到完全访问：

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8787/config/access-mode `
  -Headers @{ Authorization = "Bearer $($bootstrap.token)" } `
  -ContentType "application/json" `
  -Body '{"permissionMode":"full_access","confirmFullAccess":"我已理解风险"}'
```

## 执行模式和权限模式的关系

- 演练模式始终可用，适合先跑完整流程。
- 命令行模式调用本机 `codex` 命令。
- 应用服务模式调用 `codex app-server`，可以显示本工具启动任务的审批请求。
- 权限模式决定是否允许自动运行、是否允许补丁应用、是否需要人工确认。
