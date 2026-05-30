# GitHub 同步

GitHub 同步保持本地优先。Bridge 只调用已注册项目目录里的本机 `git` 和可选 GitHub CLI `gh`。

## 检查工具

```powershell
git --version
gh --version
```

如果要创建 PR：

```powershell
gh auth status
```

## 推荐流程

1. 在 dashboard 注册项目。
2. 保持权限模式为“人工审查”。
3. 创建并切换工作分支。
4. 创建网页补丁或 Codex 任务。
5. 查看 diff 和测试结果。
6. 本地提交。
7. 用 `gh` 创建 draft PR。

## 安全建议

- 真实仓库默认使用 `manual_review`。
- 不要在 `main` 上开启 `full_access`。
- 合并前让 ChatGPT 主控 GPT 与 Codex 做有限轮次审查。
