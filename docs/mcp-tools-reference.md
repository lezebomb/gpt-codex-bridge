# MCP Tools Reference

## 核心状态

- `get_bridge_status`
- `get_setup_guide`

## 项目与上下文

- `browse_folders`
- `select_project`
- `list_projects`
- `inspect_project`
- `read_file`
- `index_project`
- `get_index_status`
- `search_project`
- `retrieve_context`
- `refresh_context_index`
- `create_context_pack`

## 任务与 Task Branch

- `create_task`
- `list_tasks`
- `get_task`
- `continue_task`
- `create_task_branch`
- `list_task_branches`
- `get_task_branch`
- `continue_task_branch`
- `rename_task_branch`
- `archive_task_branch`
- `set_active_task_branch`
- `detect_branch_conflicts`

## WebAgent Patch

- `propose_web_patch`
- `get_patch_diff`
- `get_patch_conflict_status`
- `request_apply_patch`
- `request_revert_patch`

## Executor / Shell / 修复

- `create_execution_job`
- `get_execution_job`
- `run_shell_command`
- `get_latest_logs`
- `analyze_error_log`
- `create_repair_proposal`

## 约束

- 所有错误都应该返回 `requestId`
- 所有文件读取都必须在注册项目根目录内
- 危险写操作和命令执行都受权限模式控制
- 继续旧任务时应绑定 `projectId`、`taskId`，必要时绑定 `taskBranchId`
- 默认优先 `retrieve_context`，不要把整项目全文直接塞给 ChatGPT
