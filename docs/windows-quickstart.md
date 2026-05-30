# Windows PowerShell 快速启动

本指南面向 Windows PowerShell。所有命令默认从仓库根目录开始。

## 1. 进入项目目录

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge
```

## 2. 安装依赖

推荐从仓库根目录安装，根目录脚本会自动安装 `bridge` 依赖：

```powershell
npm.cmd install --no-audit --no-fund
```

如果依赖状态异常：

```powershell
npm.cmd run repair-install
```

如果需要清理 lock 文件后重装：

```powershell
.\scripts\windows\repair-install.ps1 -RemoveLock
```

## 3. 启动 Bridge

不需要先设置 token、权限模式或执行模式。默认端口是 `8787`，默认权限模式是“人工审查”，默认执行模式是“演练模式”。

```powershell
npm.cmd run dev
```

看到类似输出表示启动成功：

```text
Bridge listening on http://localhost:8787
```

如果 `8787` 被占用，可以临时换端口：

```powershell
$env:BRIDGE_PORT = "8788"
npm.cmd run dev
```

## 4. 打开控制台

```text
http://localhost:8787/dashboard/
```

首次打开时，页面会从本机 `/bootstrap` 自动读取服务地址和访问令牌，并填入“设置”。进入“设置”点击“测试连接”，成功提示应类似：

```text
连接成功；运行模式：演练模式；权限模式：人工审查。
```

## 5. 在界面中选择模式

进入“设置”可以选择：

- 执行模式：演练模式、命令行模式、应用服务模式
- 权限模式：只读检查、人工审查、自动审查、完全访问

访问令牌自动生成，只读显示。需要换令牌时点击“重新生成令牌”。完全访问仍需要输入：

```text
我已理解风险
```

## 6. 注册演示项目

进入“项目”，填写：

```text
项目名称: demo-project
本地路径: C:\Users\24981\Desktop\gpt-codex-bridge\examples\demo-project
```

点击“注册项目”。

## 7. 读取文件

进入“文件”，在相对路径中填写：

```text
src/App.tsx
```

点击“读取文件”。内容会加载到页面中，也会同步到右侧补丁编辑器。

## 8. 创建网页补丁

进入“网页补丁”，填写：

```text
补丁标题: 测试 README 修改
目标文件路径: README.md
操作模式: 覆盖文件
```

粘贴完整文件内容后点击“创建补丁草案”。

## 9. 查看差异、应用、回滚

1. 在补丁列表点击“差异”。
2. 确认新增/删除行颜色可读。
3. 点击“应用”并确认。
4. 状态变成“已应用”。
5. 点击“回滚”并确认。
6. 状态变成“已回滚”。

## 10. 创建演练任务

进入“执行任务”，创建安全等级为 `1` 的任务。点击“批准并运行”后，演练模式会完成任务，但不会真实调用 Codex 修改文件。

## 11. 查看日志

进入“日志”，点击“刷新”。可以按级别筛选，也可以搜索请求编号。

## 12. 修复中心测试

故意读取不存在的文件，例如：

```text
src/does-not-exist.tsx
```

页面会显示请求编号。进入“修复中心”：

1. 点击“读取最新错误”。
2. 点击“从最新错误生成草案”。
3. 检查诊断、解决方案和执行计划。
4. 点击“创建修复方案”。
5. 只有用户批准后才会创建或运行修复任务。

## 13. 本地检查命令

在仓库根目录：

```powershell
npm.cmd run check:public
npm.cmd run build
npm.cmd run smoke
```

浏览器 UI 冒烟测试需要保持 Bridge 正在运行：

```powershell
npm.cmd run ui:smoke
```
