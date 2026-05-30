# 完整使用教程：从安装到修复流程

这份教程按普通 Windows 用户的路径写：先启动，再打开控制台，再注册项目、读文件、创建补丁、应用/回滚、创建演练任务、看日志、用修复中心。

## 0. 需要准备什么

需要安装：

- Windows 10/11
- Node.js LTS 或更新版本
- PowerShell

可选：

- Git，用于从 GitHub 克隆和更新
- Codex CLI，用于后续真实执行；第一次建议先用“演练模式”

检查 Node：

```powershell
node --version
npm --version
```

## 1. 进入项目

如果你已经有项目目录：

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge
```

如果以后从 GitHub 获取，示例：

```powershell
git clone https://github.com/OWNER/REPO.git
cd .\REPO
```

## 2. 安装依赖

在仓库根目录运行：

```powershell
npm.cmd install --no-audit --no-fund
```

如果安装失败或程序完全打不开，运行修复：

```powershell
npm.cmd run repair-install
```

如果还不行，做一次更彻底的依赖重装：

```powershell
.\scripts\windows\repair-install.ps1 -RemoveLock
```

## 3. 启动服务

```powershell
npm.cmd run dev
```

默认端口是 `8787`。看到类似输出就可以打开浏览器：

```text
Bridge listening on http://localhost:8787
```

打开：

```text
http://localhost:8787/dashboard/
```

不需要提前设置 token、执行模式或权限模式。控制台会自动从本机服务读取配置。

## 4. 第一次进入设置

打开“设置”。

你会看到：

- 本机服务地址：自动填写，通常是 `http://localhost:8787`
- 本机访问令牌：自动生成，只读展示
- 执行模式：默认“演练模式”
- 权限模式：默认“人工审查”

点击“测试连接”。成功时会看到：

```text
连接成功；运行模式：演练模式；权限模式：人工审查。
```

如果想换一个本机访问令牌，点击“重新生成令牌”。普通使用不需要点。

## 5. 选择模式

建议第一次保持：

- 执行模式：演练模式
- 权限模式：人工审查

执行模式说明：

- 演练模式：不真实调用 Codex，适合测试完整流程。
- 命令行模式：调用本机 `codex` 命令，跟随本机登录状态。
- 应用服务模式：通过 `codex app-server` 同步本工具启动的任务。

权限模式说明：

- 只读检查：不能应用补丁，不能危险执行。
- 人工审查：推荐默认模式，关键动作都要你确认。
- 自动审查：低风险任务可自动运行，高风险仍需审批。
- 完全访问：危险模式，只建议一次性分支或演示项目使用；开启前必须输入“我已理解风险”。

## 6. 注册演示项目

进入“项目”，填写：

```text
项目名称: demo-project
本地路径: C:\Users\24981\Desktop\gpt-codex-bridge\examples\demo-project
```

点击“注册项目”。

注册后，顶部项目下拉框会选中该项目。

## 7. 查看项目上下文

在“项目”页点击“加载文件树”或“检查项目”。

你会看到项目路径、文件数量、版本状态和目录树。Bridge 只允许访问注册项目里面的相对路径。

## 8. 读取文件

进入“文件”，在“相对文件路径”填写：

```text
src/App.tsx
```

点击“读取文件”。

页面会显示：

- 路径
- 大小
- 更新时间
- 文件内容

右侧补丁编辑器会自动填入当前文件路径和内容。

## 9. 从文件编辑器创建补丁

在“文件”页右侧编辑内容，然后填写：

```text
补丁标题: 更新 src/App.tsx
原因: 测试补丁流程
```

点击“从编辑器创建补丁”。

这只会创建补丁草案，不会立刻修改文件。

## 10. 在网页补丁页创建补丁

也可以进入“网页补丁”手动创建：

```text
补丁标题: 测试 README 修改
原因: 验证补丁应用和回滚
目标文件路径: README.md
操作模式: 覆盖文件
完整文件内容: 粘贴完整 README 内容
```

点击“创建补丁草案”。

## 11. 查看差异

在补丁列表点击“差异”，或进入“差异查看器”输入补丁编号。

差异颜色含义：

- 绿色：新增行
- 红色：删除行
- 蓝色：差异块位置

## 12. 应用补丁

在补丁列表点击“应用”。页面会弹出确认。

确认后，Bridge 会：

- 检查权限模式
- 写入备份
- 修改目标文件
- 把补丁状态改为“已应用”
- 写入日志

如果当前是“只读检查”，按钮不会静默失败，而会显示阻止原因。

## 13. 回滚补丁

对“已应用”的补丁点击“回滚”。确认后，Bridge 会用备份恢复文件，并把状态改为“已回滚”。

## 14. 创建演练任务

进入“执行任务”，填写：

```text
标题: 验证控制台流程
角色: 前端工程、质量检查，可留空
安全等级: 1 - 低风险
任务: 检查演示项目是否能正常构建，并给出结论。
```

点击“创建任务”。

在任务列表点击“批准并运行”。演练模式会让任务完成，但不会真实调用 Codex。

## 15. 查看日志

进入“日志”，点击“刷新”。

你可以：

- 按信息 / 警告 / 错误筛选
- 搜索请求编号
- 复制日志
- 清空日志

## 16. 故意触发错误

进入“文件”，读取一个不存在的文件：

```text
src/does-not-exist.tsx
```

页面会显示错误面板，包含：

- 接口
- HTTP 状态码
- 请求编号
- 错误详情

这个请求编号可以用于日志搜索和修复中心。

## 17. 使用修复中心

进入“修复中心”。

1. 点击“读取最新错误”。
2. 点击“从最新错误生成草案”。
3. 检查错误摘要、简短诊断、解决方案和执行计划。
4. 点击“创建修复方案”。
5. 审查方案后点击“批准并运行”。

演练模式下不会真实修改文件。切换到命令行模式或应用服务模式前，建议先确认项目已经在 Git 中有可回滚状态。

## 18. 语言切换

顶部有“中文 / English”切换。选择会保存到浏览器 localStorage。

中文模式下，主要页面、按钮、错误提示、状态、权限说明和表单标签都会显示中文。少量品牌名、命令、路径、请求编号会保留原文，方便复制。

## 19. 安装成程序

在仓库根目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install.ps1
```

安装后从开始菜单启动：

```text
Start ChatGPT Codex Bridge
```

安装版会默认安装到：

```text
%LOCALAPPDATA%\ChatGPTCodexBridge
```

启动时会后台运行 Bridge，并自动打开控制台。

## 20. 从 GitHub 安装和更新

以后放到 GitHub 后，推荐这样安装：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install.ps1 `
  -SourceRepo "https://github.com/OWNER/REPO.git" `
  -Branch "main"
```

更新：

```powershell
powershell -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\ChatGPTCodexBridge\scripts\windows\update.ps1"
```

这种方式会保留 Git 信息，所以更新器可以拉取最新代码、安装依赖并重新构建。

## 21. 最推荐的日常流程

1. 从开始菜单启动 Bridge，或运行 `npm.cmd run dev`。
2. 打开控制台。
3. 保持“演练模式”和“人工审查”。
4. 注册项目。
5. 读取相关文件。
6. 创建补丁或执行任务。
7. 先看差异和日志。
8. 人工确认后再应用补丁或运行真实任务。
9. 遇到错误时，用请求编号进入修复中心。

## 22. 遇到问题先看哪里

- 程序打不开：看 [troubleshooting.md](troubleshooting.md) 的“程序完全打不开”。
- 认证失败：在“设置”点击“重新读取本机配置”。
- 下拉框看不清：刷新页面并确认加载的是最新 `styles.css`。
- 真实 Codex 不运行：先确认当前执行模式不是“演练模式”，再确认 `codex --version` 可用。
