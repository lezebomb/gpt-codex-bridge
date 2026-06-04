# Windows 安装、启动与更新

本项目提供轻量 per-user 安装脚本，不写入 `Program Files`，默认安装到：

```text
%LOCALAPPDATA%\ChatGPTCodexBridge
```

## 从本地仓库安装

仓库根目录：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install.ps1
```

安装器会：

- 复制项目到用户目录。
- 在 `bridge` 中运行 `npm.cmd install --no-audit --no-fund --cache .\.npm-cache`。
- 运行 `npm.cmd run build`。
- 创建开始菜单快捷方式。
- 创建 dashboard 快捷方式。

如果依赖安装失败，先在仓库根目录运行：

```powershell
npm.cmd run repair-install
```

## 从 GitHub 安装并支持更新

发布到 GitHub 后推荐：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install.ps1 `
  -SourceRepo "https://github.com/lezebomb/gpt-codex-bridge.git" `
  -Branch "main"
```

这种方式保留 `.git`，后续可以更新：

```powershell
powershell -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\ChatGPTCodexBridge\scripts\windows\update.ps1"
```

也可以双击安装目录里的：

```text
scripts\windows\update-bridge.cmd
```

## 启动

开始菜单：

```text
Start ChatGPT Codex Bridge
```

或：

```powershell
powershell -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\ChatGPTCodexBridge\scripts\windows\start-bridge.ps1"
```

也可以双击：

```text
scripts\windows\start-bridge.cmd
```

前台看日志：

```powershell
powershell -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\ChatGPTCodexBridge\scripts\windows\start-bridge.ps1" -Foreground
```

## 修复依赖

```powershell
npm.cmd run repair-install
```

或：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\repair-install.ps1 -RemoveLock
```

脚本会使用项目内 `.npm-cache`，减少 Windows 用户目录 npm cache 权限问题。

等价的手动修复命令是：

```powershell
cd .\bridge
npm.cmd cache clean --force --cache .\.npm-cache
Remove-Item -Recurse -Force .\node_modules -ErrorAction SilentlyContinue
Remove-Item -Force .\package-lock.json -ErrorAction SilentlyContinue
npm.cmd install --no-audit --no-fund --cache .\.npm-cache
```

## 打包 release zip

给 GitHub Release 准备 zip：

```powershell
npm.cmd run release:zip
```

zip 会生成到仓库根目录的 `release` 文件夹。真正想支持自动更新，仍建议让用户按“从 GitHub 安装并支持更新”的方式安装，因为那会保留 `.git` 并允许 `update.ps1` 拉取最新代码。

## 卸载

```powershell
powershell -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\ChatGPTCodexBridge\scripts\windows\uninstall.ps1"
```

同时删除安装文件：

```powershell
powershell -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\ChatGPTCodexBridge\scripts\windows\uninstall.ps1" -RemoveFiles
```
