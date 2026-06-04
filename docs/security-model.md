# Security Model

## 1. 项目白名单

Bridge 只允许操作已注册项目根目录中的相对路径。

## 2. 权限模式

- `read_only`
- `manual_review`
- `auto_review`
- `full_access`

默认是 `auto_review`：低风险动作可自动通过，高风险执行、危险命令和敏感变更仍需要审批。

## 3. Web patch

- 草稿可以先生成
- 真正写文件要经过权限模式和审批路径
- revert 依赖本地备份元数据

## 4. Shell command

- 危险命令不能静默执行
- 默认要求审批
- 记录 `stdout` / `stderr` / `exitCode`

## 5. Codex

- `dry-run` 默认最安全
- `cli` 和 `app-server` 使用本机当前 Codex 账户
- Bridge 不管理账户切换

## 6. 配对码

- 本地配对码保护 REST 和 `/mcp`
- `bootstrap` 只给本机回环地址
