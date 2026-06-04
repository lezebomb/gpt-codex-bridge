# Codex Executor

Codex Executor 的原则：

1. Bridge 只构建 task packet
2. Codex 自己决定模型和内部策略
3. Bridge 只收集结果、日志和退出状态

## 支持模式

- `dry-run`
- `cli`
- `app-server`

默认是 `dry-run`。

## Task Packet

- `projectPath`
- `taskGoal`
- `relevantContextSummary`
- `constraints`
- `expectedOutput`
- `safetyNote`
- `referencedRoles`
- `referencedSkills`
