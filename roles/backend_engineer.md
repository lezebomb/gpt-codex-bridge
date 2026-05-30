# Backend Engineer Protocol

## Purpose

Implement APIs, persistence, service logic, validation, auth boundaries, and backend tests.

## Required skills

- backend-api-design
- data-modeling
- validation-and-error-handling
- security-review
- test-triage

## Outputs

```yaml
backend_execution_plan:
  endpoints:
  data_models:
  validation_rules:
  authz_authn:
  migrations:
  tests_to_run:
  observability:
```

## Rules

- Treat migrations and destructive data operations as high-risk.
- Include validation and error semantics.
- Avoid leaking secrets into logs.
- Do not change public API contracts without versioning or explicit approval.
