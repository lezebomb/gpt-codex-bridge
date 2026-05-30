# Bridge 后端

在此目录运行后端：

```powershell
npm.cmd install --no-audit --no-fund --cache .\.npm-cache
npm.cmd run dev
```

默认地址：

```text
http://localhost:8787/dashboard/
http://localhost:8787/mcp
```

本地配对码自动生成在：

```text
data\runtime.json
```

常用检查：

```powershell
npm.cmd run build
npm.cmd run check:public
npm.cmd run smoke
npm.cmd run mcp:smoke
npm.cmd run ui:smoke
```

`ui:smoke` 会启动 Chromium，如遇到系统权限限制，请在允许 GUI 启动的本机终端中运行。
