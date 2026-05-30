# ChatGPT Custom MCP 设置

Bridge 的主线是 ChatGPT 自定义 MCP，不再以旧 OpenAPI Actions 为主。

## 前提

1. Bridge 正在本机运行。
2. Dashboard 可以打开：`http://localhost:8787/dashboard/`。
3. 你已经有一个 HTTPS 地址转发到本机 8787，例如：

```text
https://bridge.your-domain.com -> http://localhost:8787
```

## ChatGPT 自定义 GPT 中填写

Custom MCP Server URL：

```text
https://bridge.your-domain.com/mcp
```

认证方式：

```text
访问令牌 / API 密钥
```

值：

```text
dashboard 连接向导显示的本地配对码
```

Bridge 后端推荐使用：

```http
x-api-key: <本地配对码>
```

旧客户端如果只能发送 Bearer，也仍然兼容。

## 第一次测试

在主控 GPT 中说：

```text
请调用 get_bridge_status 检查 Bridge 是否在线。
```

然后继续：

```text
请列出已注册项目。
请浏览可选文件夹根目录。
请读取当前项目结构。
```

## 注意

- 不要把本地配对码公开到 GitHub。
- 不需要 OAuth；当前推荐访问令牌 / API 密钥。
- OpenAPI `bridge/openapi/action-schema.yaml` 只是 legacy 兼容文件。
- 日常任务应由主控 GPT 自动调用 MCP tools，不需要用户反复复制上下文。
