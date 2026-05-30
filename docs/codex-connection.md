# Codex 连接说明

Bridge 保留三种执行模式。

## dry-run

默认模式，始终可用。

- 不调用 Codex。
- 不改文件。
- 适合测试 dashboard、MCP、审批和日志流程。

## cli

调用本机 `codex` 命令。

检查：

```powershell
codex --version
```

Bridge 不管理账号切换，只使用本机当前 `codex` 登录状态。切换账号请使用你自己的 Codex 工具，然后重新运行任务。

## app-server

实验模式。保留已有能力，但不要夸大：

- 通过 Bridge 创建的 job 可以同步到 dashboard。
- 直接在 Codex Desktop 中单独开的任务，不一定能自动同步。

## 在 dashboard 切换

进入“高级”：

1. 选择执行模式。
2. 点击保存。
3. 再创建新的 Codex job。

## 通过 MCP 创建 job

主控 GPT 调用：

```text
create_codex_job
```

建议先用：

```text
executionPreference: dry-run
safetyLevel: 1
runImmediately: true
```
