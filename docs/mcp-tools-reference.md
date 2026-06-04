# MCP Tools Reference

## 核心状态

- `get_bridge_status`
- `get_setup_guide`

## 项目

- `browse_folders`
- `select_project`
- `list_projects`
- `inspect_project`
- `read_file`

## 任务

- `create_task`
- `list_tasks`
- `get_task`
- `continue_task`
- `create_context_pack`

## WebAgent Patch

- `propose_web_patch`
- `get_patch_diff`
- `request_apply_patch`
- `request_revert_patch`

## 执行器

- `create_execution_job`
- `get_execution_job`
- `create_webagent_task`
- `create_codex_job`
- `get_codex_job`

## Shell / Logs / Repair

- `run_shell_command`
- `get_latest_logs`
- `analyze_error_log`
- `create_repair_proposal`

## UI / Review

- `create_ui_screenshot_job`
- `get_ui_screenshot_result`
- `create_cross_review`
- `add_cross_review_round`
- `finalize_cross_review`

## 约束

- 所有错误都应该返回 `requestId`
- 所有文件读取都必须在注册项目根目录内
- 危险写操作和命令执行必须受权限模式控制
