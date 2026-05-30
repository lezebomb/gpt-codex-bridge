# Windows PowerShell 从零使用教程

## 1. 解压或克隆项目

建议放到桌面：

```text
C:\Users\24981\Desktop\gpt-codex-bridge
```

## 2. 安装依赖

必须进入 `bridge` 目录：

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge\bridge
npm.cmd install --no-audit --no-fund --cache .\.npm-cache
```

不要在仓库根目录直接运行 `npm run dev` 来判断后端是否安装成功；后端项目在 `bridge` 目录。Windows PowerShell 中优先使用 `npm.cmd`。

## 3. 启动 Bridge

```powershell
npm.cmd run dev
```

默认：

```text
端口：8787
执行模式：演练模式
权限模式：人工审查
```

不需要预先设置配对码。Bridge 会自动生成“本地配对码”，需要更换时在“连接向导”点击“重新生成”。

## 4. 打开 dashboard

```text
http://localhost:8787/dashboard/
```

进入“连接向导”，点击“测试连接”。

## 5. 注册 demo project

进入“项目”，选择或粘贴：

```text
C:\Users\24981\Desktop\gpt-codex-bridge\examples\demo-project
```

点击“注册项目”。

## 6. 读取文件

在“项目”页面输入：

```text
src/App.tsx
```

点击“读取文件”。

## 7. 创建网页补丁

进入“任务”：

1. 标题：`更新 README 测试`
2. 文件路径：`README.md`
3. 模式：`覆盖现有文件`
4. 填入完整文件内容
5. 点击“创建补丁草稿”
6. 点击“查看差异”
7. 确认后点击“应用”
8. 需要恢复时点击“回滚”

Bridge 会在项目目录下创建备份：

```text
.chatgpt-codex\patch-backups
```

## 8. 创建演练模式 Codex 任务

进入“任务”：

1. 标题：`演练验证`
2. 安全等级：`1`
3. 任务说明：`请检查项目结构并给出验证建议。`
4. 点击“创建 Codex 任务”
5. 在任务卡片点击“批准并运行”

演练模式不会真实调用 Codex，也不会改文件。

## 9. 查看日志和修复方案

进入“日志”，点击“刷新”。如果有错误，复制 `requestId`。

进入“高级”的“修复中心”，填写错误摘要、诊断、方案和步骤，创建修复方案。修复方案不会自动执行，必须在“审批”中确认。

## 10. 连接 ChatGPT Custom MCP

本地测试可以先看：

```text
http://localhost:8787/mcp
```

ChatGPT 需要 HTTPS。用 Cloudflare Tunnel 或 ngrok 暴露：

```text
https://bridge.your-domain.com -> http://localhost:8787
```

ChatGPT Custom MCP 填：

```text
https://bridge.your-domain.com/mcp
```

认证选择“访问令牌 / API 密钥”，值填 dashboard 的“本地配对码”。

## 11. 安装成开始菜单程序

从仓库根目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install.ps1
```

以后从开始菜单启动：

```text
Start ChatGPT Codex Bridge
```
