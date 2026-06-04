# Executors

## WebAgent

默认执行器。

适合：

- UI
- CSS
- 文案
- 小组件
- 单文件改动

## Codex

适合：

- 多文件重构
- 测试修复
- 依赖安装
- 复杂 bug
- 集成问题

## Hybrid

适合：

- WebAgent 先出小补丁
- Codex 再做集成验证
- 最终走 bounded cross review

## External

当前只提供 dry-run/stub。

配置文件：

`bridge/config/external-executors.json`
