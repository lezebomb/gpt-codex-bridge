# ChatGPT Apps / MCP Product Plan

Use this after the Actions MVP works.

## MCP tools to expose

- `list_projects`: list local allowlisted projects.
- `inspect_project`: read README, package metadata, tree, git status.
- `create_codex_job`: create a Codex execution job from a role-reviewed task packet.
- `get_job_status`: return current status, log tail, and approval requirements.
- `read_job_result`: return diff summary, changed files, test results, screenshots.
- `approve_job_step`: approve a write/shell/GitHub/deploy step.
- `cancel_job`: cancel or mark a job as blocked.

## UI widgets

- Project picker
- Role route preview
- Approval card
- Diff summary card
- Test result card
- Retry/continue card

## State model

```text
project -> task -> role_outputs -> codex_job -> runs -> approvals -> result
```

## Implementation notes

Keep the same bridge service as the source of truth. Add an MCP/App layer on top of it rather than duplicating job state.
