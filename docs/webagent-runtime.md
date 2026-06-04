# WebAgent Runtime

`bridge/src/runtime/webagent/` 负责本地运行时组件。

当前包含：

- `ContextCollector`
- `InstructionLoader`
- `SkillLoader`
- `PatchEngine`
- `DiffManager`
- `ApprovalEngine`
- `ShellRunner`
- `TaskStore`
- `LogStore`

## 设计原则

- 不把全部项目上下文一次性塞进提示
- 先摘要，再按需深读
- 任务、补丁、日志和执行器状态全部落到本地状态文件
