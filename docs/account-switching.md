# Codex 账号切换说明

Bridge 不管理 ChatGPT/Codex 账号，也不保存账号凭据。它只跟随本机当前 `codex` 命令或 `codex app-server` 能看到的登录状态。

## 推荐做法

1. 在 Codex 自己的工具中完成账号切换。
2. 回到 dashboard。
3. 如果使用“应用服务模式”，打开“执行器连接”并点击“刷新账号信息”。
4. 再创建新的执行任务。

## 限制

如果 Codex Desktop 和 Codex CLI 使用不同的本地认证存储，Bridge 跟随 CLI / app-server 看到的账号，不一定等于桌面应用界面当前显示的账号。

直接在 Codex Desktop 单独创建的任务，当前不保证自动同步到 dashboard。
