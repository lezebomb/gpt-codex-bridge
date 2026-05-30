# MCP Tools Reference

Bridge 在 `/mcp` 暴露 Streamable HTTP MCP Server。所有工具调用都会写入 `bridge\data\logs\YYYY-MM-DD.jsonl`，错误会返回 `requestId`。

## 状态与设置

- `get_bridge_status`：返回版本、执行模式、权限模式、项目数量、最近错误和 MCP Center 摘要。
- `get_setup_guide`：返回 Windows、Cloudflare 和 ChatGPT Custom MCP 设置提示。

## 项目与文件

- `list_projects`：列出已注册项目。
- `browse_folders`：安全浏览文件夹，只返回目录。
- `select_project`：把文件夹注册为项目白名单。
- `inspect_project`：读取 README、package、Git 状态和目录摘要。
- `read_file`：读取项目内相对路径文件，阻止路径穿越。
- `create_context_pack`：生成 markdown 上下文包。

## Web Patch

- `propose_web_patch`：创建补丁草稿，不直接写文件。
- `get_patch_diff`：返回补丁 diff。
- `request_apply_patch`：请求应用补丁。
- `request_revert_patch`：请求回滚补丁。

权限规则：

- `manual_review`：进入 dashboard 审批。
- `auto_review`：低风险补丁可自动应用，高风险仍需审批。
- `full_access`：可直接应用/回滚，但会记录日志。
- `read_only`：禁止写文件。

## Codex

- `create_codex_job`：创建 dry-run、cli 或 app-server job。
- `get_codex_job`：读取 job 状态、输出、结果和事件。

`dry-run` 默认可用，不会改文件。`cli` 使用本机 `codex` 命令和当前登录状态。`app-server` 保留为实验模式。

## 日志与修复

- `get_latest_logs`：按 level、requestId 和 limit 读取日志。
- `analyze_error_log`：把错误日志结构化为原因和建议动作。
- `create_repair_proposal`：创建修复方案，等待用户审批。

## UI 与交叉审查

- `create_ui_screenshot_job`：创建 UI 截图审查任务。
- `get_ui_screenshot_result`：读取截图任务结果。
- `create_cross_review`：创建有界交叉审查。
- `add_cross_review_round`：添加一轮审查。
- `finalize_cross_review`：做最终决策。

交叉审查最多 1 到 3 轮。最终决策必须是：

- `use_web_patch`
- `use_codex_result`
- `hybrid`
- `needs_human`
