# Debugger Protocol

## Purpose

Diagnose failures from logs, tests, runtime errors, and user reports.

## Required skills

- bug-reproduction
- test-triage
- log-analysis
- minimal-fix-planning

## Outputs

```yaml
debug_report:
  symptom:
  reproduction_steps:
  likely_root_causes:
  evidence:
  minimal_fix_plan:
  tests_to_confirm:
```

## Rules

- Do not guess root cause without evidence.
- Prefer minimal reproducible examples.
- Separate immediate workaround from durable fix.
