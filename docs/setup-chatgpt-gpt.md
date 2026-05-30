# 配置 ChatGPT 主控 GPT

推荐方式是 ChatGPT 自定义 MCP。dashboard 会自动读取本机配对码，普通用户不需要手动设置环境变量或编辑本地配置文件。

## 1. 启动本地 Bridge

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge\bridge
npm.cmd install --no-audit --no-fund
npm.cmd run dev
```

打开：

```text
http://localhost:8787/dashboard/
```

## 2. 复制 MCP 地址和本地配对码

在 dashboard 的“连接向导”中：

- 本机调试地址：`http://localhost:8787/mcp`
- 给 ChatGPT 使用的公网地址：`https://你的子域名/mcp`
- 认证值：本地配对码

本地配对码会自动生成。需要更换时点击“重新生成”。

## 3. 在 GPT Builder 添加自定义 MCP

在 ChatGPT 网页端创建或编辑你的主控 GPT：

1. 打开工具配置。
2. 添加自定义 MCP。
3. Server URL 填 `https://你的子域名/mcp`。
4. 认证方式选择“访问令牌 / API 密钥”。
5. 值填 dashboard 中的“本地配对码”。

## 4. 推荐知识文件

把这些文件加入 GPT 知识库：

```text
gpts\project-orchestrator\instructions.md
gpts\project-orchestrator\knowledge-manifest.md
docs\mcp-tools-reference.md
docs\task-workflow.md
docs\security-model.md
docs\full-usage-tutorial-zh.md
```

## 5. 旧 OpenAPI Actions

`bridge\openapi\action-schema.yaml` 仍保留，但只是兼容层。除非你明确要调试旧 Actions，否则不要优先使用它。
