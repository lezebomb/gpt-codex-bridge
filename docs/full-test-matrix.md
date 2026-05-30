# 完整测试矩阵

本矩阵默认 Windows PowerShell。

## A. 安装依赖

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge
npm.cmd install --no-audit --no-fund
```

## B. 静态检查

```powershell
npm.cmd run check:public
npm.cmd run build
```

## C. 后端烟测

```powershell
npm.cmd run smoke
```

## D. 启动服务

```powershell
npm.cmd run dev
```

默认地址：

```text
http://localhost:8787/dashboard/
```

## E. 浏览器 UI 烟测

保持服务运行：

```powershell
npm.cmd run ui:smoke
```

预期：

- 自动读取本机令牌。
- 错误令牌能显示认证失败。
- 正确令牌能测试连接成功。
- 中文 / English 切换可用。
- 侧边栏收起和展开可用。
- 下拉框高对比可读。
- 演示项目注册、文件读取、补丁、差异、应用、回滚、演练任务、日志、修复中心可用。

## F. 手动 UI 流程

1. 打开“设置”并测试连接。
2. 打开“项目”注册 `examples\demo-project`。
3. 打开“文件”读取 `src/App.tsx`。
4. 打开“网页补丁”创建草案。
5. 打开“差异查看器”确认差异可读。
6. 应用补丁并回滚。
7. 打开“执行任务”创建安全等级 `1` 的演练任务。
8. 批准并运行任务。
9. 打开“日志”筛选错误或搜索请求编号。
10. 故意读取不存在文件，确认错误面板有请求编号。
11. 打开“修复中心”生成修复草案。

## G. 应用服务模式测试

先确认本机 `codex` 可用：

```powershell
codex --version
```

在“设置”中把执行模式切换为“应用服务模式”，再创建低风险任务。预期：只有通过本工具启动的任务会同步到 dashboard；直接在 Codex Desktop 单独开的任务不保证自动同步。
