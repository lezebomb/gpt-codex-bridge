# AGENTS.md

Use the repository skills in `.agents/skills` when relevant.

## General workflow

1. Inspect existing conventions before editing.
2. Make the smallest safe change.
3. Run narrow tests first, then broader tests.
4. Report changed files, test commands, results, and unresolved risks.
5. Stop for approval before risky operations.

## High-risk operations

Ask for explicit approval before:

- dependency installation
- migrations
- destructive file operations
- shell scripts with side effects
- push/PR/deploy/release
- reading or exposing secrets
