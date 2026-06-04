# 新手看护式设置指南

这是面向第一次使用者的简版流程。更完整的说明见 [full-usage-tutorial-zh.md](full-usage-tutorial-zh.md)。

## 1. 打开 PowerShell

```powershell
cd <repo-root>
```

## 2. 安装依赖

```powershell
npm.cmd install --no-audit --no-fund
```

如果失败：

```powershell
npm.cmd run repair-install
```

## 3. 启动

```powershell
npm.cmd run dev
```

打开：

```text
http://localhost:8787/dashboard/
```

## 4. 测试连接

进入“连接向导”，点击“测试连接”。地址和本地配对码会自动填写，不需要手动设置。

## 5. 注册演示项目

进入“项目”，填写：

```text
项目名称: demo-project
本地路径示例: .\examples\demo-project
```

点击“注册项目”。

## 6. 读取文件

进入“项目”，在“读取文件与上下文”中读取：

```text
src/App.tsx
```

## 7. 测试补丁

进入“任务”，创建一个网页补丁草案；查看差异后先应用，再回滚。

## 8. 测试任务

进入“任务”，创建安全等级 `1` 的演练任务，点击“批准并运行”。

## 9. 测试修复中心

故意读取：

```text
src/does-not-exist.tsx
```

进入“高级”的“修复中心”，读取最新错误并生成草案。

## 10. 后续接入 Codex

先确认演练模式流程没问题，再在“高级”中切换为“命令行模式”或“应用服务模式”。本工具不管理账号，跟随本机当前 Codex 登录状态。
