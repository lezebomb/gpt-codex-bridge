# 任务工作流

## 角色分工

主控 GPT：

- 理解需求。
- 读取项目上下文。
- 生成小范围 Web Patch。
- 创建 Codex job。
- 读取日志并提出修复方案。

Codex：

- 多文件实现。
- 跑测试。
- 修复集成问题。
- 审查 ChatGPT Web patch。

Dashboard：

- 本地连接。
- 项目文件夹选择。
- 审批。
- 日志。
- 能力中心。

## 推荐流程

1. 主控 GPT 调用 `get_bridge_status`。
2. 调用 `list_projects` 或 `browse_folders/select_project`。
3. 调用 `inspect_project` 和 `read_file`。
4. 小改动用 `propose_web_patch`。
5. 查看 `get_patch_diff`。
6. 根据权限模式调用 `request_apply_patch` 或等待 dashboard 审批。
7. 大改动用 `create_codex_job`。
8. 用 `get_codex_job` 读取结果。
9. 出错时用 `get_latest_logs` 和 `analyze_error_log`。
10. 需要修复时用 `create_repair_proposal`，等待用户审批。

## 不要无限互审

Cross Review 最多 1 到 3 轮。每轮只输出：

- blocking issue
- concrete improvement
- evidence
- recommended decision

最终必须选择：

- `use_web_patch`
- `use_codex_result`
- `hybrid`
- `needs_human`
