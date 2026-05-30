# ChatGPT 自定义 MCP 产品计划

当前主线已经是自定义 MCP。Apps SDK 或更复杂的 UI widget 可以以后再做，不阻塞本地工作流。

## 已暴露的 MCP tools

- `get_bridge_status`
- `get_setup_guide`
- `list_projects`
- `browse_folders`
- `select_project`
- `inspect_project`
- `read_file`
- `create_context_pack`
- `propose_web_patch`
- `get_patch_diff`
- `request_apply_patch`
- `request_revert_patch`
- `create_codex_job`
- `get_codex_job`
- `get_latest_logs`
- `analyze_error_log`
- `create_repair_proposal`
- `create_ui_screenshot_job`
- `get_ui_screenshot_result`
- `create_cross_review`
- `add_cross_review_round`
- `finalize_cross_review`

## dashboard 角色

dashboard 不是主界面。它只负责：

- 连接向导。
- 项目文件夹选择。
- 审批。
- 日志和错误排查。
- MCP 能力中心。
- 运行模式和权限模式切换。

## 后续可选方向

- 更细的 MCP tool 分组开关。
- 桌面通知。
- 发布版安装包。
- App widget 形式的审批卡片。
