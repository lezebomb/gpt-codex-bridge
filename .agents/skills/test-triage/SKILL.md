---
name: test-triage
description: Diagnose failing tests, CI failures, build errors, lint/type errors, runtime exceptions, and flaky behavior. Use when Codex receives logs, stack traces, failed commands, or broken verification results.
---

# Test Triage

Process failures as evidence:

1. Identify failing command.
2. Extract exact error.
3. Map error to likely file/module.
4. Reproduce minimally.
5. Fix the smallest cause.
6. Rerun the narrow test first, then broader suite.

Do not rewrite unrelated code to make tests pass.
