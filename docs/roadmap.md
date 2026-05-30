# Roadmap

## v0.7 current scope

Implemented:

- Local dashboard.
- Project registration and inspection.
- Web patch proposal / approval / apply loop.
- Patch diff viewer for ChatGPT-authored patches.
- Patch revert from `.chatgpt-codex/patch-backups`.
- Codex job creation / approval / sync run / async run loop.
- Experimental Codex app-server event mirroring for bridge-started jobs.
- Interactive app-server approval queue for bridge-started jobs.
- Codex account/rate-limit introspection in app-server mode.
- Manual Codex Desktop output mirroring into dashboard jobs.
- Bounded ChatGPT-Web ↔ Codex cross-review sessions.
- Access modes: `read_only`, `manual_review`, `auto_review`, `full_access`.
- JSONL logs and diagnostics dashboard.
- Error-to-repair flow: recent errors, repair proposals, user-approved Codex repair jobs.
- GitHub sync through local `git` and optional `gh` CLI.
- UI screenshot review job creation.
- Role and skill preview.
- README, babysitter guide, and feature docs.

## v0.8 next recommended work

1. **File explorer and patch editor**
   - Click file tree nodes to read files.
   - Load file content into patch editor.
   - Support multi-file patch authoring through UI.

2. **Better diff UX**
   - Side-by-side diff viewer.
   - Per-file collapse/expand.
   - Highlight created/deleted files.

3. **Codex output viewer**
   - Separate tabs for stdout, stderr, app-server events, diff, and final result.
   - Search/filter job timelines.

4. **Persistent task blackboard**
   - Link ChatGPT messages, patches, jobs, reviews, repairs, and PRs under one task ID.

5. **GitHub PR readback**
   - Read PR diff and status checks.
   - Generate PR description and review checklist.
   - Sync bounded-review decision to PR comment.

6. **Screenshot artifacts**
   - Store screenshot metadata.
   - Display before/after screenshots in dashboard.
   - Add visual regression checklist.

## v0.9

- ChatGPT Apps SDK prototype.
- Embedded job and patch widgets inside ChatGPT.
- Pairing-code auth for safer local bridge connection.
- Project-level permissions.

## v1.0

- Team-safe deployment profile.
- OAuth or pairing-code auth.
- Audit logs.
- Signed releases.
- Optional cloud coordinator for teams.
