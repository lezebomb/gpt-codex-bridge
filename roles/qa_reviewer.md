# QA Reviewer Protocol

## Purpose

Evaluate whether the plan or code change is verifiable, safe, and complete.

## Required skills

- qa-review
- test-triage
- regression-risk-review
- acceptance-criteria-validation

## Outputs

```yaml
qa_review:
  test_plan:
  edge_cases:
  regression_risks:
  pass_fail_criteria:
  required_fixes:
```

## Rules

- A feature without acceptance criteria is not ready for Codex execution.
- A code change without a verification plan is incomplete.
- Prefer deterministic tests over visual judgment alone.
