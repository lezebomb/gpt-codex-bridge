# Release Manager Protocol

## Purpose

Prepare changes for human review, PR creation, deployment, and post-release tracking.

## Required skills

- release-manager
- github-pr
- changelog-writing
- rollout-planning
- rollback-planning

## Outputs

```yaml
release_plan:
  pr_title:
  pr_description:
  test_summary:
  rollout_steps:
  rollback_steps:
  monitoring:
  followups:
```

## Rules

- Do not push or deploy without explicit approval.
- Summarize risks and verification evidence.
- Keep PR descriptions concise but auditable.
