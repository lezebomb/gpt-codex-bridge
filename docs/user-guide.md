# 用户指南

新版控制台默认中文、自动生成本机访问令牌，并且可以在界面里选择执行模式和权限模式。

推荐阅读顺序：

1. [Windows PowerShell 快速启动](windows-quickstart.md)
2. [完整中文使用教程](full-usage-tutorial-zh.md)
3. [安装、启动与更新](windows-installer.md)
4. [排错指南](troubleshooting.md)

## 最短启动路径

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge
npm.cmd install --no-audit --no-fund
npm.cmd run dev
```

打开：

```text
http://localhost:8787/dashboard/
```

进入“设置”，点击“测试连接”。本机服务地址和访问令牌会自动填写，不需要提前设置环境变量。

## 推荐工作流

1. 保持“演练模式”和“人工审查”。
2. 注册项目。
3. 读取文件。
4. 创建网页补丁或执行任务。
5. 查看差异和日志。
6. 人工确认后应用补丁、回滚补丁或批准任务。
7. 遇到错误时用请求编号进入“修复中心”。

## 模式说明

- 演练模式：始终可用，不真实调用 Codex。
- 命令行模式：调用本机 `codex` 命令。
- 应用服务模式：通过 `codex app-server` 同步本工具启动的任务。
- 人工审查：推荐默认权限模式。
- 完全访问：危险模式，只建议一次性分支或演示项目使用。
