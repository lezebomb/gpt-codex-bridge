# Patch Safety

Patch apply 前必须执行 preflight。`request_apply_patch` 内部会调用 preflight；也可以先显式调用 `preflight_patch_apply`。

## Preflight checks

- `baseGitHead` 是否过期。
- touched files 是否与其他 active Task Branch 重叠。
- 目标文件当前内容是否相对 patch draft 变化。
- patch 是否会覆盖已有变更。
- 是否需要 manual approval。
- 是否建议创建 isolated worktree。

## Safety report

返回字段包括：

- `safeToApply`
- `stalePatch`
- `branchConflict`
- `overlappingFiles`
- `conflictingBranches`
- `baseGitHead`
- `currentGitHead`
- `requiresApproval`
- `suggestedAction`
- `preflightReport`

如果 `approvalRequired=true`，主控 GPT 应等待 Dashboard Approvals 决策。

