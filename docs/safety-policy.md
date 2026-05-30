# Safety Policy

## Hard rules

1. Never operate outside the project allowlist.
2. Never read secrets unless the user explicitly approves a narrowly scoped need.
3. Never print secrets in ChatGPT responses, logs, or task summaries.
4. Never install dependencies, run migrations, delete files, push commits, create PRs, or deploy without explicit user approval.
5. Prefer temporary branches or worktrees for every Codex execution.
6. Return diffs and test results before asking the user to accept changes.
7. Treat third-party MCP servers and skills as untrusted until reviewed.

## Approval levels

- Level 0: Pure planning, no tools.
- Level 1: Read-only project inspection.
- Level 2: Local code edits in temporary branch/worktree.
- Level 3: Test execution and build commands.
- Level 4: Dependency installation, migrations, network calls.
- Level 5: GitHub write actions, PR creation, deployment, release tagging.

Levels 2-5 require explicit confirmation.

## MCP minimization

Enable only the minimum MCP servers needed for a task. Avoid combining broad filesystem access with broad shell or GitHub write access.
