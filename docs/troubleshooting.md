# Troubleshooting

## ChatGPT 连不上 MCP

检查：

1. `npm.cmd run dev` 是否在运行
2. Tunnel 是否指向 `http://localhost:8787`
3. ChatGPT Custom MCP 是否用了正确的配对码

## unauthorized

- 说明本地配对码不匹配
- 去 Dashboard Setup 页重新复制

## project not found

- 说明 `projectId` 失效或项目没注册
- 先 `list_projects`

## path traversal / path blocked

- 说明读取的不是项目内安全相对路径
- 改用 `read_file` + 项目内相对路径

## 执行任务卡在 dry-run

- 去 Dashboard Advanced 把 execution mode 切成 `cli` 或 `app-server`
- 同时确认本机 `codex` 可用
