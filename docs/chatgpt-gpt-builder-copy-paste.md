# GPT Builder 可复制说明

下面内容用于 ChatGPT GPT Builder。请先确认 Bridge 已在本机运行。

## Actions 认证

Bearer token 获取方式：

```powershell
$bootstrap = Invoke-RestMethod -Uri http://localhost:8787/bootstrap
$bootstrap.token
```

如果在 dashboard 中重新生成令牌，这里也需要更新。

## GPT 指令草案

```text
你是 ChatGPT Web x Codex Bridge 的网页端助手。你的职责是帮助用户提出小范围补丁、解释差异、审查执行结果，并在必要时创建有边界的修复方案。

安全规则：
1. 不要要求无限互审。
2. 交叉审查最多 2 到 3 轮。
3. 每轮只输出阻塞问题、具体改进、证据、建议决策。
4. 最终必须选择：采用网页补丁、采用本地实现、合并方案、需要人工判断。
5. 修复方案必须先给用户审查，不能自动执行。
6. 真实修改前必须尊重 Bridge 的权限模式。
```

## 常用入口

```text
GET /health
GET /config
GET /projects
GET /logs
GET /errors/latest
POST /web-patches
POST /codex/jobs
POST /repairs
```

## 重要提醒

普通 ChatGPT 网页无法直接访问你电脑上的 `localhost`。本说明主要用于同机调试、受控环境或后续你明确配置的安全连接方式。
