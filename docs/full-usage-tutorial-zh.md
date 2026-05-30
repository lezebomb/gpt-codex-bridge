# 完整使用教程

## A. 本机第一次启动

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge\bridge
npm.cmd install --no-audit --no-fund --cache .\.npm-cache
npm.cmd run dev
```

打开：

```text
http://localhost:8787/dashboard/
```

进入“连接向导”，点击“测试连接”。看到“连接成功”后继续。

## B. 安装成程序

仓库根目录：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install.ps1
```

以后从开始菜单启动 `Start ChatGPT Codex Bridge`。发布到 GitHub 后，用 `-SourceRepo` 安装可以支持更新。

## C. 连接 ChatGPT

1. 用 Cloudflare Tunnel 暴露 `http://localhost:8787`。
2. 在 ChatGPT 自定义 GPT 添加 Custom MCP。
3. URL 填 `https://bridge.your-domain.com/mcp`。
4. 认证填 dashboard 的“本地配对码”。
5. 在主控 GPT 里说：“请调用 get_bridge_status。”

## D. 选择项目

Dashboard -> 项目：

1. 从 Home、Desktop、Documents 或磁盘进入目标目录。
2. 点击“选择当前文件夹”。
3. 或粘贴路径并点击“注册项目”。

## E. 让主控 GPT 读项目

在 ChatGPT 里说：

```text
请检查当前项目结构，并读取 src/App.tsx。
```

主控 GPT 应调用：

- `inspect_project`
- `read_file`

## F. 小改动：网页补丁

适用：

- 文案。
- CSS。
- 单文件组件。
- 小范围 UI。

流程：

1. 主控 GPT 调 `propose_web_patch`。
2. 调 `get_patch_diff`。
3. 用户确认后调 `request_apply_patch`。
4. 如果需要审批，到 dashboard 任务/审批确认。
5. 不满意可 `request_revert_patch` 或 dashboard 回滚。

## G. 大改动：Codex 任务

适用：

- 多文件实现。
- 跑测试。
- 修复杂 bug。
- 依赖和集成。

流程：

1. 主控 GPT 调 `create_codex_job`。
2. 默认先用“演练模式”。
3. 需要真实执行时在 dashboard 的“高级”页切换到命令行模式或应用服务模式。
4. 审批后运行。
5. 调 `get_codex_job` 读取结果。

## H. 报错修复

1. 复制 requestId。
2. 主控 GPT 调 `get_latest_logs` 或 `analyze_error_log`。
3. 主控 GPT 生成简短修复方案。
4. 调 `create_repair_proposal`。
5. 用户在 dashboard 审批。

## I. UI 截图

1. 启动目标项目 dev server。
2. 主控 GPT 调 `create_ui_screenshot_job`。
3. Codex/Playwright 生成截图或给出启动缺失提示。
4. 主控 GPT 根据截图提出修复。

## J. 交叉审查

最多 1 到 3 轮。最后必须决策：

- 采用网页补丁。
- 采用 Codex 实现。
- 混合。
- 需要人工判断。

不要无限互相审查。
