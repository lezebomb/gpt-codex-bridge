# Windows 安装、启动与更新

本项目提供轻量 per-user 安装脚本。它不会安装系统服务，也不会写入 `Program Files`；默认安装到当前用户目录：

```text
%LOCALAPPDATA%\ChatGPTCodexBridge
```

启动端口等最小配置保存在：

```text
%APPDATA%\ChatGPTCodexBridge\bridge-env.ps1
```

访问令牌和执行模式保存在安装目录下的：

```text
bridge\data\runtime.json
```

普通用户不需要手动打开这个文件。控制台会自动读取令牌；需要更换时，在“设置”里点击“重新生成令牌”。

## 从本地仓库安装

在仓库根目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install.ps1
```

安装器会：

- 复制项目文件到 `%LOCALAPPDATA%\ChatGPTCodexBridge`。
- 排除 `.git`、`node_modules`、测试输出和日志。
- 在 `bridge` 目录执行 `npm.cmd install --no-audit --no-fund`。
- 执行 `npm.cmd run build`。
- 生成本机随机访问令牌。
- 创建开始菜单快捷方式。
- 创建 Dashboard URL 快捷方式。

安装完成后，从开始菜单启动：

```text
Start ChatGPT Codex Bridge
```

启动脚本会后台启动 Bridge，等待 `/bootstrap` 可用，然后打开浏览器。

## 常用安装参数

通常不需要传参数。需要改端口或不创建桌面快捷方式时：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install.ps1 `
  -Port "8787" `
  -Execution "dry-run" `
  -PermissionMode "manual_review" `
  -NoDesktopShortcut
```

不建议给普通用户指定固定 token。留空即可自动生成。

## 从 GitHub 安装

项目发布到 GitHub 后，推荐用户用 `-SourceRepo` 安装。示例地址请替换成真实仓库：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install.ps1 `
  -SourceRepo "https://github.com/OWNER/REPO.git" `
  -Branch "main"
```

这种安装方式会保留 `.git`，后续才能直接自动更新。

## 启动程序

开始菜单：

```text
Start ChatGPT Codex Bridge
```

或直接运行：

```powershell
powershell -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\ChatGPTCodexBridge\scripts\windows\start-bridge.ps1"
```

默认打开：

```text
http://localhost:8787/dashboard/
```

如果需要在当前窗口看日志：

```powershell
powershell -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\ChatGPTCodexBridge\scripts\windows\start-bridge.ps1" -Foreground
```

## 更新程序

如果是通过 `-SourceRepo` 从 GitHub 安装，运行：

```powershell
powershell -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\ChatGPTCodexBridge\scripts\windows\update.ps1"
```

更新器会：

- 拉取指定分支最新代码。
- 安装依赖。
- 重新构建后端。

如果用户是从本地复制安装的，没有 `.git`，更新器会提示重新从更新后的本地仓库安装，或改用 `-SourceRepo` 安装。

## 修复依赖

如果程序完全打不开，先在安装目录或仓库根目录运行：

```powershell
npm.cmd run repair-install
```

也可以直接运行脚本：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\repair-install.ps1 -RemoveLock
```

## 卸载

只移除快捷方式和配置：

```powershell
powershell -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\ChatGPTCodexBridge\scripts\windows\uninstall.ps1"
```

同时移除安装目录：

```powershell
powershell -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\ChatGPTCodexBridge\scripts\windows\uninstall.ps1" -RemoveFiles
```

卸载脚本只会在安装目录位于 `%LOCALAPPDATA%` 下时删除文件，避免误删任意目录。

## GitHub 发布建议

建议仓库保留以下入口：

- `README.md`：用户快速启动和安全说明。
- `docs/full-usage-tutorial-zh.md`：完整中文教程。
- `docs/windows-installer.md`：安装、更新、卸载。
- `scripts/windows/install.ps1`：安装器。
- `scripts/windows/start-bridge.ps1`：启动器。
- `scripts/windows/update.ps1`：更新器。
- `scripts/windows/uninstall.ps1`：卸载器。

后续如果要真正打包 `.exe` 或 `.msi`，可以在当前脚本安装器稳定后，再用 GitHub Actions 包装这些脚本。当前方案更透明，也方便用户审查本地执行了什么。
