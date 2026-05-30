# Sync Options Between ChatGPT Web, Codex, and Local Code

## Option A: Local bridge context sync

Best for personal use.

```text
ChatGPT Web <-> HTTPS tunnel <-> local bridge <-> local project files
```

Capabilities:

- Read selected local files.
- Read bounded tree snapshots.
- Write approved full-file patches.
- Read git diff/status.
- Create Codex jobs.

Risks:

- The bridge exposes local file access through a network-accessible URL.
- Requires strict bearer token, tunnel controls, path whitelisting, and approvals.

## Option B: Codex-to-ChatGPT result sync

Best when you do not want ChatGPT Web to read local files directly.

```text
Codex runs locally -> bridge stores summary/diff/logs -> ChatGPT reads job result
```

Capabilities:

- ChatGPT does not read arbitrary files.
- Codex sends structured summaries, diffs, and test logs.
- Safer but less powerful for web-authored patches.

## Option C: GitHub sync

Best for open-source and team use.

```text
Local repo <-> GitHub branch/PR <-> ChatGPT Web via GitHub connector/action <-> Codex
```

Capabilities:

- Strong audit trail.
- Natural review surface through PRs.
- Easier for multiple users.

Tradeoffs:

- Slower loop than local bridge.
- Requires GitHub auth and branch hygiene.
- Sensitive private code should not be pushed to public repositories.

## Recommended default

Use local bridge for personal MVP development. Add GitHub sync after the local patch/review loop works reliably.
