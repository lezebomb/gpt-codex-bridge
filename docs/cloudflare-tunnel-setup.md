# Cloudflare Tunnel Setup

目标是把本地 `http://localhost:8787` 暴露成 `https://your-domain/mcp`。

## 示例

```powershell
cloudflared tunnel --url http://localhost:8787
```

或者使用你自己的命名 Tunnel，把域名指到本地 8787。

## ChatGPT 里填什么

- Dashboard URL: `https://your-domain/dashboard/`
- MCP URL: `https://your-domain/mcp`

## 安全建议

- 只把 `/mcp` 暴露给你自己控制的域名
- ChatGPT 认证使用本地配对码
- 高风险操作仍然要经过 Bridge 权限模式
