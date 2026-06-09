# WebAgent Runtime

WebAgent = ChatGPT 网页端 GPT 驱动的本地 coding runtime。

Bridge 不在本地调用模型。Bridge 提供本地执行层：项目 allowlist、context index、retrieve_context、patch draft、preflight、approval queue、shell guard、EventStore、LogStore、Executor Router。

## 推荐流程

1. `list_projects` / `list_tasks` / `list_task_branches`
2. `get_task_branch`
3. `continue_task_branch`
4. `retrieve_context`
5. `propose_web_patch`
6. `preflight_patch_apply`
7. `request_apply_patch`

每个网页端对话都绑定一个 `taskBranchId`。不要依赖网页端聊天记忆恢复项目状态。

