# Bridge Runtime

`bridge/` 是本地服务端和本地控制面板。

## 启动

```powershell
npm.cmd install --no-audit --no-fund
npm.cmd run dev
```

默认地址：

```text
http://localhost:8787/dashboard/
http://localhost:8787/mcp
```

本地配对码保存在：

```text
bridge/data/runtime.json
```

## 主要目录

```text
bridge/src/
  bridge-service.ts
  mcp-server.ts
  server.ts
  runtime/webagent/
  executors/
bridge/public/
bridge/scripts/
bridge/config/external-executors.json
```

## 常用检查

```powershell
npm.cmd run build
node --check public/app.js
npm.cmd run smoke
npm.cmd run mcp:smoke
```

`ui:smoke` 需要本机能启动浏览器。
