# 安全模型

## 本地配对码

Bridge 自动生成本地配对码，保存在：

```text
bridge\data\runtime.json
```

Dashboard 会自动读取。ChatGPT Custom MCP 需要使用同一个配对码。

## 项目白名单

所有文件读取和写入必须位于已注册项目目录内。以下路径会被阻止：

- 绝对文件路径。
- `..` 路径穿越。
- `.git`、`node_modules`、`dist`、`build` 等忽略目录。
- 未注册项目目录外的文件。

## 权限模式

- `read_only`：只读检查，禁止写文件和危险执行。
- `manual_review`：关键动作进入人工审批。
- `auto_review`：低风险读取、上下文包、patch 草稿和低风险自动动作可执行；高风险仍需审批。
- `full_access`：危险模式，必须输入 `I understand` 或 `我已理解风险`。

## 需要审批的动作

- apply/revert patch。
- 覆盖或删除文件。
- 运行 shell 命令。
- 安装依赖。
- git commit / push。
- 切换 full_access。
- 修改项目目录之外的文件。

## 日志

日志路径：

```text
bridge\data\logs\YYYY-MM-DD.jsonl
```

每条日志包含时间、级别、requestId、来源、动作、消息和详情。不要把包含敏感路径或错误详情的日志原样公开到 GitHub issue，先检查内容。
