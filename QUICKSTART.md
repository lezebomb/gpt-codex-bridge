# 快速启动

## 1. 在 Windows PowerShell 启动

在仓库根目录运行：

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge
npm.cmd install --no-audit --no-fund
npm.cmd run dev
```

打开：

```text
http://localhost:8787/dashboard/
```

进入“设置”，点击“测试连接”。服务地址和访问令牌会自动读取，不需要手动填写。

## 2. 第一次安全试用

1. 打开“项目”，注册 `C:\Users\24981\Desktop\gpt-codex-bridge\examples\demo-project`。
2. 打开“文件”，读取 `src/App.tsx`。
3. 打开“网页补丁”，为 `README.md` 创建一个小补丁。
4. 打开“差异查看器”，检查差异。
5. 应用补丁，然后回滚补丁。
6. 打开“执行任务”，创建安全等级为 `1` 的演练任务。
7. 点击“批准并运行”。
8. 打开“日志”，确认操作记录可见。
9. 故意读取不存在的文件触发请求编号，再进入“修复中心”生成修复草案。

## 3. 本地检查

在仓库根目录运行：

```powershell
npm.cmd run check:public
npm.cmd run build
npm.cmd run smoke
```

浏览器 UI 冒烟测试需要 Bridge 正在运行：

```powershell
npm.cmd run ui:smoke
```

## 4. 安装成程序

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install.ps1
```

安装和更新说明见 [docs/windows-installer.md](docs/windows-installer.md)。完整使用教程见 [docs/full-usage-tutorial-zh.md](docs/full-usage-tutorial-zh.md)。
