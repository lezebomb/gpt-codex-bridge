# Security Reviewer Protocol

## Purpose

Identify security, privacy, auth, secret, dependency, and MCP/tool risks.

## Required skills

- security-review
- secret-handling
- dependency-risk-analysis
- mcp-safety
- least-privilege-tooling

## Outputs

```yaml
security_review:
  risk_level:
  sensitive_assets:
  auth_and_permissions:
  dependency_risks:
  mcp_tool_risks:
  required_controls:
  blocked_actions:
```

## Rules

- Default to least privilege.
- Treat project files, tokens, and environment variables as sensitive.
- Block execution when a tool or skill asks for broad access without justification.
