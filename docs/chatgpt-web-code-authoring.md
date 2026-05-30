# ChatGPT Web Code Authoring Mode

This project is not limited to prompt generation. ChatGPT Web can be allowed to author selected code changes directly when the bridge exposes bounded local file context and an explicit patch-approval API.

## Why this exists

Some work is better suited to ChatGPT Web than to a coding-only execution agent:

- UI copy and layout judgment.
- Component API shape and page composition.
- Product-facing error, empty, loading, and success states.
- Accessibility checklists and UX tradeoffs.
- Small documentation, README, and configuration text.

Codex remains the implementation executor and verifier for repository-wide changes, local test execution, dependency updates, refactors, and integration fixes.

## Hybrid loop

```text
ChatGPT Web reads bounded project context
  -> ChatGPT Web authors a small full-file patch
  -> user approves apply_web_patch
  -> bridge writes files locally and stores backups
  -> Codex reviews/runs tests/fixes integration issues
  -> ChatGPT Web reviews Codex results and decides next step
```

## When to let ChatGPT Web write code

Use web-authored patches for:

- Small UI components.
- CSS/Tailwind class changes.
- HTML/JSX structure changes.
- Copy, state labels, empty states, tooltips, and micro-interactions.
- README and docs.
- Small config files where the target content is clear.

Do not use web-authored patches for:

- Repository-wide refactors.
- Auth, payment, cryptography, permissions, or secrets.
- Database migrations.
- Lockfiles and generated files.
- Dependency installation.
- Anything requiring local tests before it is safe to write.

## Bridge tools used

- `list_project_tree`: discover candidate files.
- `read_project_file`: read one file.
- `create_project_snapshot`: gather a small context pack.
- `create_web_patch`: create a full-file patch proposal.
- `apply_web_patch`: write files after explicit approval.
- `get_git_diff`: inspect local diff after applying.
- `create_codex_review_job_from_web_patch`: delegate test/review/fix work to Codex.

## Patch format

v0.4 deliberately uses full-file replacements instead of unified diff parsing. It is less compact, but safer for review: the user and bridge can see exactly what content will exist after apply.

Each patch change contains:

```json
{
  "filePath": "src/components/LoginCard.tsx",
  "mode": "overwrite",
  "content": "...complete new file content..."
}
```

## GitHub sync option

For a public or team workflow, GitHub can be the synchronization layer:

1. Codex works on a branch or worktree.
2. Bridge exposes git status and diff to ChatGPT.
3. ChatGPT writes small patches through the bridge or comments on a GitHub issue/PR.
4. Codex validates and pushes a branch or creates a PR only after explicit approval.

GitHub sync is better for collaboration and audit trails. Local bridge sync is better for fast personal iteration.


## Dashboard support

The local dashboard at `/dashboard/` exposes the same bridge state to the user. Use it to inspect project registration, approve or reject web patches, create Codex review jobs, and debug job results before wiring the bridge to a public ChatGPT Action.
