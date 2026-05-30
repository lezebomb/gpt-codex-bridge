---
name: web-patch-review
description: Review and harden small full-file patches authored by ChatGPT Web before or after they are applied locally. Use when a task mentions web patch, ChatGPT-authored patch, UI patch, full-file replacement, or bridge-applied code and Codex must run tests, inspect diffs, fix integration issues, or verify accessibility and build correctness.
---

# Web Patch Review

## Purpose

Treat ChatGPT Web as the product/UI author and Codex as the local verifier and integration engineer.

## Steps

1. Inspect `git status --short --branch` and `git diff --` before editing.
2. Identify files changed by the ChatGPT-authored patch.
3. Check whether the patch matches project conventions, imports, types, routing, state management, styling, and accessibility rules.
4. Run the smallest relevant validation commands available in the repo, such as typecheck, lint, unit tests, or targeted UI tests. Do not install dependencies without approval.
5. Fix only issues introduced by the web patch unless the user explicitly expands scope.
6. Return:
   - changed_files
   - issues_found
   - fixes_applied
   - commands_run
   - test_results
   - remaining_risks

## Boundaries

- Do not rewrite the product intent unless it is impossible to implement safely.
- Do not convert a small patch into a broad refactor.
- Do not push branches, deploy, or modify secrets.
- If the web patch touches auth, payment, cryptography, permissions, data migrations, or generated files, stop and ask for explicit human approval before continuing.
