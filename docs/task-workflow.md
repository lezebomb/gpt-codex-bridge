# Task Workflow

## 基本对象

- `projectId`: 一个注册项目目录
- `taskId`: 一个任务
- `executionJobId`: 一个执行器任务实例

## 推荐流程

1. `get_bridge_status`
2. `list_projects`
3. 没项目就 `browse_folders` + `select_project`
4. `inspect_project`
5. `create_task`
6. 有需要时 `create_context_pack`
7. `create_execution_job`
8. `get_execution_job`

## 继续旧任务

新对话中不要凭聊天记忆继续工作。应当：

1. `get_task`
2. 或 `continue_task`
3. 重新读取相关 `contextPackIds` / `patchIds` / `executionJobIds`

## 任务字段

- `taskTitle`
- `taskGoal`
- `status`
- `executorMode`
- `executorPolicy`
- `contextPackIds`
- `patchIds`
- `executionJobIds`
- `approvals`
- `logs`
- `artifacts`
- `relatedConversationHint`

## 冲突

当多个 task 指向同一项目且声明或产生了相同文件路径时，Bridge 会返回冲突提示，提醒用户不要在并发任务里静默覆盖同一文件。
