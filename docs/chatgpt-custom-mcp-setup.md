# ChatGPT Custom MCP Setup

## 目标

把 ChatGPT 网页端连到本地 Bridge 的 `/mcp`。

## 步骤

1. 本地启动 Bridge

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge\bridge
npm.cmd install --no-audit --no-fund
npm.cmd run dev
```

2. 用 Cloudflare Tunnel 把 `http://localhost:8787` 暴露为 HTTPS

3. 在 ChatGPT Custom MCP 中填写：

- Server URL: `https://your-domain/mcp`
- Auth type: `Access token / API key`
- Token value: Dashboard Setup 页显示的本地配对码

4. 第一次连接成功后，建议先调用：

- `get_bridge_status`
- `list_projects`

## 配对码

- 配对码是本地 Bridge 的访问令牌
- 不要把它叫 Bearer token 给用户心智负担
- 它保存在 `bridge/data/runtime.json`
- 普通用户只需要在 Dashboard 里复制，不需要手改文件
