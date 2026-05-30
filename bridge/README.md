# Bridge API and Dashboard

Bridge 是本项目的本地 Express 服务和静态 dashboard。

## Windows PowerShell 启动

可以从仓库根目录运行 `npm.cmd run dev`，也可以在 `bridge` 目录直接运行：

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge\bridge
npm.cmd install --no-audit --no-fund
npm.cmd run dev
```

打开：

```text
http://localhost:8787/dashboard/
```

## Scripts

```powershell
npm.cmd run check:public
npm.cmd run build
npm.cmd run smoke
npm.cmd run ui:smoke
```

## Environment

```powershell
$env:BRIDGE_PORT = "8787"
$env:CODEX_BIN = "codex"
$env:CODEX_ARGS = "exec --json"
$env:CODEX_JOB_TIMEOUT_MS = "1200000"
$env:MAX_FILE_BYTES = "200000"
$env:MAX_SNAPSHOT_FILES = "40"
```

Execution modes:

```text
dry-run      不真实执行 Codex
cli          调用本机 codex 命令
app-server   保留 app-server 集成路径
```

token 和当前执行模式默认保存在 `bridge\data\runtime.json`，dashboard Settings 可直接修改。环境变量 `BRIDGE_TOKEN` / `CODEX_EXECUTION` 只作为首次创建 runtime 文件时的初始值。

## Main endpoints

- `GET /health`
- `GET /bootstrap`
- `GET /config`
- `POST /config/runtime`
- `POST /config/access-mode`
- `GET /projects`
- `POST /projects`
- `GET /projects/:id/tree`
- `GET /projects/:id/files/read?path=...`
- `POST /projects/:id/context-pack`
- `POST /web-patches`
- `GET /web-patches/:id/diff`
- `POST /web-patches/:id/apply`
- `POST /web-patches/:id/revert`
- `POST /codex/jobs`
- `POST /codex/jobs/:id/approve`
- `POST /codex/jobs/:id/run`
- `POST /codex/jobs/:id/run-async`
- `GET /codex/approvals`
- `POST /codex/approvals/:id/decision`
- `GET /logs`
- `GET /errors/latest`
- `POST /repairs`
- `GET /support-bundle`

除 `/health` 和本机 `/bootstrap` 外，接口都需要：

```text
Authorization: Bearer <current token>
```
