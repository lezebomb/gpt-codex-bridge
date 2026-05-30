# Production Hardening Notes

This project is safe-oriented but still a local code-execution bridge. Before giving it to other people, add or enforce:

- per-user pairing codes;
- HTTPS-only access;
- short-lived tokens;
- project allowlists;
- no default full_access;
- branch/worktree isolation;
- audit log retention;
- explicit approval for shell, dependency install, migration, push, deploy, or secret access;
- rate limits on public endpoints;
- no bridge exposure without authentication;
- security review of every third-party MCP server.

For team use, prefer GitHub PR synchronization rather than direct writes to shared branches.
