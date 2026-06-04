# External Executors

当前 External Executor 是 dry-run/stub。

目的不是硬编码某个第三方工具，而是先固定配置结构：

- `id`
- `name`
- `command`
- `args`
- `cwdMode`
- `env`
- `enabled`
- `riskLevel`

配置文件：

`bridge/config/external-executors.json`

未来可以接入：

- Claude Code-compatible CLI
- DeepSeek CLI
- OpenRouter agent
