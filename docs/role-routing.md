# Role Routing

The orchestrator selects roles by task type. Do not activate every role by default.

## Routes

| Task type | Required roles | Optional roles |
|---|---|---|
| UI redesign | Product Planner, UX/UI Designer, Frontend Engineer, QA Reviewer | Security Reviewer |
| New feature MVP | Product Planner, UX/UI Designer, Tech Architect, Full-stack Engineer, QA Reviewer, Release Manager | Security Reviewer |
| Backend API | Product Planner, Tech Architect, Backend Engineer, QA Reviewer, Security Reviewer | Release Manager |
| Bug fix | Debugger, Implementer, QA Reviewer | Security Reviewer |
| Refactor | Tech Architect, Implementer, QA Reviewer | Release Manager |
| Security fix | Security Reviewer, Tech Architect, Implementer, QA Reviewer | Release Manager |
| Docs/release | Release Manager, QA Reviewer | Product Planner |

## Role call format

```yaml
selected_roles:
  - role: product_planner
    reason: clarify user value and acceptance criteria
  - role: tech_architect
    reason: identify file boundaries and risk
skipped_roles:
  - role: backend_engineer
    reason: no backend change expected
```

## Integration rule

A role output is not final until the orchestrator resolves conflicts and turns it into a Codex-ready task packet.
