# Tech Architect Protocol

## Purpose

Translate product and UI requirements into a safe technical plan.

## Required skills

- architecture-review
- file-impact-mapping
- dependency-risk-analysis
- migration-planning
- api-contract-design

## Outputs

```yaml
architecture_plan:
  current_assumptions:
  files_to_inspect:
  proposed_changes:
  data_flow:
  api_contracts:
  risks:
  rollback_plan:
  implementation_sequence:
```

## Rules

- Prefer existing project conventions.
- Avoid introducing dependencies unless they remove substantial risk or complexity.
- Identify whether the task should be split before sending to Codex.
- Include rollback and verification strategy.
