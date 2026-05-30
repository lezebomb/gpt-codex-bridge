# 配置 ChatGPT GPT / Actions

本地 dashboard 不需要手动 token；但如果你要把 Bridge 暴露给 ChatGPT Actions 调用，Actions 仍需要 Bearer 认证。

## 1. 先启动 Bridge

```powershell
cd C:\Users\24981\Desktop\gpt-codex-bridge
npm.cmd run dev
```

## 2. 获取当前本机令牌

```powershell
$bootstrap = Invoke-RestMethod -Uri http://localhost:8787/bootstrap
$bootstrap.token
```

也可以在 dashboard 的“设置”里查看只读令牌。

## 3. 导入 Action schema

schema 位于：

```text
bridge\openapi\action-schema.yaml
```

在 GPT Builder 的 Actions 中导入该 schema。

## 4. 配置认证

认证类型选择 Bearer，并填入第 2 步看到的当前令牌。

注意：如果你在 dashboard 里点击“重新生成令牌”，GPT Builder 中的 Bearer token 也需要同步更新。

## 5. 本地限制

普通 ChatGPT 网页无法直接访问你电脑上的 `localhost`，除非你使用了受控的本地隧道或同机调试环境。不要把 Bridge 暴露到公网，除非你非常清楚网络和认证风险。
