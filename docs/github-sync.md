# GitHub Sync

GitHub sync is intentionally local-first. It uses local `git` and optional GitHub CLI (`gh`) from the registered project directory.

## Requirements

```bash
git --version
gh --version
```

For PR creation:

```bash
gh auth status
```

## Dashboard flow

1. Open **GitHub Sync**.
2. Create and checkout a working branch.
3. Apply a web patch or run a Codex job.
4. Inspect diff.
5. Commit locally.
6. Create a draft PR.

## Safety

- Keep `manual_review` mode for real repositories.
- Do not use `full_access` on `main`.
- Prefer draft PRs until ChatGPT/Codex bounded review is complete.
