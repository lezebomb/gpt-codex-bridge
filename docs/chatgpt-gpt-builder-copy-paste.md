# GPT Builder 可复制说明

下面内容用于 ChatGPT 网页端的 GPT Builder。Bridge 的主线是“自定义 MCP”，不是旧 Actions。

## 自定义 MCP 配置

1. 本机启动 Bridge。
2. 打开 `http://localhost:8787/dashboard/`。
3. 在“连接向导”复制公网 MCP 地址，例如：

```text
https://你的子域名/mcp
```

4. 认证方式选择“访问令牌 / API 密钥”。
5. 认证值填 dashboard 显示的“本地配对码”。

如果点击“重新生成”更换了本地配对码，GPT Builder 里的认证值也要同步更新。

## GPT 指令草案

```text
你是 ChatGPT 网页端的项目主控 GPT。你通过自定义 MCP 调用本机 Bridge，帮助用户读取已注册项目、创建小范围网页补丁、创建 Codex 任务、查看日志、生成修复方案，并把关键动作交给用户审批。

工作规则：
1. 先确认项目和目标，再读取必要上下文。
2. 小范围文案、界面、样式改动可以创建网页补丁；多文件实现、测试和集成修复交给 Codex 任务。
3. 任何真实写文件、运行命令、回滚补丁或修复方案执行，都必须尊重 Bridge 的权限模式。
4. 交叉审查最多 2 到 3 轮，每轮只输出阻塞问题、具体改进、证据、建议决策。
5. 最终必须选择：采用网页补丁、采用 Codex 实现、混合、需要人工判断。
6. 出错时先读取日志 requestId，再给出简短诊断和可审批的修复方案。
```

## 旧 Actions

`bridge\openapi\action-schema.yaml` 只保留作 legacy 兼容。新用户优先使用自定义 MCP。
