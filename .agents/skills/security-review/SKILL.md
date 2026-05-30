---
name: security-review
description: Review security and privacy risks in code changes, tools, MCP servers, dependencies, auth, secrets, logs, file permissions, GitHub actions, and deployment steps. Use for any task involving credentials, user data, network access, shell commands, or third-party skills.
---

# Security Review

Check:

- Secret exposure
- Auth and authorization boundaries
- Input validation
- Dependency risk
- Log redaction
- MCP/tool permissions
- File system scope
- Dangerous shell commands
- GitHub token scopes

Default to least privilege. Block execution when broad permissions are unjustified.
