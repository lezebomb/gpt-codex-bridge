# Cloudflare Tunnel 设置

目标：

```text
https://bridge.your-domain.com -> http://localhost:8787
```

ChatGPT Custom MCP 最终填写：

```text
https://bridge.your-domain.com/mcp
```

## 1. 启动本地 Bridge

PowerShell：

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge\bridge
npm.cmd run dev
```

确认本地可访问：

```powershell
Invoke-RestMethod http://localhost:8787/health
```

## 2. 创建子域名

例如：

```text
bridge.example.com
```

已有主域名的其他用途不会冲突，只要使用新的子域名。

## 3. 用 Cloudflare Tunnel 转发

如果已经安装 `cloudflared`，可按 Cloudflare Zero Trust 面板创建 tunnel，并把 public hostname 指向：

```text
http://localhost:8787
```

也可以本地临时测试：

```powershell
cloudflared tunnel --url http://localhost:8787
```

## 4. ChatGPT 中使用

```text
Server URL: https://bridge.example.com/mcp
Auth: Access token / API key
Value: 本地配对码
```

## 5. 安全提醒

- 不要关闭 Bridge 的配对码认证。
- 不要把 `bridge\data\runtime.json` 提交到 GitHub。
- 如果怀疑配对码泄露，在 dashboard 点击“重新生成”。
- OpenAI Secure MCP Tunnel 当前不是本项目必要路径；服务器 URL 模式更适合已有 Cloudflare 域名的场景。
