# 测试指南

本指南优先使用 Windows PowerShell。

## 静态检查和构建

在仓库根目录运行：

```powershell
npm.cmd run check:public
npm.cmd run build
npm.cmd run smoke
```

## 启动服务

```powershell
npm.cmd run dev
```

默认地址：

```text
http://localhost:8787/dashboard/
```

不需要手动设置配对码。测试脚本和页面都会通过本机 `/bootstrap` 自动读取本地配对码。

## 浏览器 UI 冒烟测试

保持 Bridge 正在运行，然后在另一个 PowerShell 窗口运行：

```powershell
npm.cmd run ui:smoke
```

UI 冒烟测试覆盖：

- 自动读取本机令牌。
- 空令牌不会长期显示吓人的认证失败。
- 错误令牌会显示清晰认证错误。
- 正确令牌测试连接成功。
- 中文 / English 切换。
- 侧边栏收起后仍可展开。
- 下拉框深色高对比。
- 注册演示项目。
- 读取 `src/App.tsx`。
- 创建补丁、查看差异、应用、回滚。
- 创建并运行演练任务。
- 日志和修复中心流程。

## 手动验收清单

1. 打开“连接向导”，点击“测试连接”。
2. 切换中文 / English，再切回中文。
3. 收起侧边栏，再展开。
4. 打开下拉框，确认没有灰底白字。
5. 注册 `examples\demo-project`。
6. 读取 `src/App.tsx`。
7. 创建网页补丁。
8. 查看差异。
9. 应用补丁，再回滚。
10. 创建安全等级 `1` 的演练任务并批准运行。
11. 打开“日志”确认有记录。
12. 故意读取不存在文件，确认错误面板有请求编号。
13. 进入“修复中心”，从最新错误生成草案。

## API 手动检查

PowerShell 中不要依赖 `curl`。使用：

```powershell
$bootstrap = Invoke-RestMethod -Uri http://localhost:8787/bootstrap
Invoke-RestMethod `
  -Uri http://localhost:8787/config `
  -Headers @{ "x-api-key" = $bootstrap.token }
```
