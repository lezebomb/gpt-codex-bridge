# Feature Map

## ChatGPT Web side

- Project orchestration and role routing.
- Reading project context through ChatGPT Custom MCP tools.
- Creating context packs.
- Writing small full-file patch proposals.
- Comparing ChatGPT-authored patches against Codex results.
- Creating concise repair proposals from bridge/job errors.
- Enforcing bounded cross-review to avoid endless debate.

## Bridge side

- Whitelisted local project registry.
- File tree and file-read APIs.
- Context pack generation.
- Web patch proposal, diff, apply, reject, and revert.
- Codex job queue with manual/automatic approval policies.
- Codex CLI and app-server execution modes.
- app-server approval queue for command/file approvals.
- Git status, diff, branch, commit, and GitHub PR helpers.
- Logs, diagnostics, support bundle, and repair center.
- Dashboard UI.

## Codex side

- Repository-wide implementation.
- Running commands and tests.
- Fixing integration issues.
- Reviewing ChatGPT Web-authored patches.
- UI screenshot review through project tooling/Playwright.
- Using global or repo-level `.agents/skills`.

## Non-goals

- The bridge does not scrape or automate ChatGPT Web UI.
- The bridge does not manage Codex account switching.
- The bridge does not silently write arbitrary files outside registered project roots.
- The bridge does not guarantee access to unrelated Codex Desktop sessions that were not started through the bridge.
