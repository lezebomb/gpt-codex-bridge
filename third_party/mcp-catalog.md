# Curated MCP Catalog

This project does not vendor third-party MCP servers. Install from the upstream projects after reviewing license, permissions, and security posture.

## Core

| Need | MCP server | Why | Suggested default |
|---|---|---|---|
| Safe file access | `@modelcontextprotocol/server-filesystem` | Read/write allowlisted directories | Restrict to project root only |
| Git operations | `mcp-server-git` | Inspect diffs, status, history | Prefer read-only during planning |
| Reflective planning | `@modelcontextprotocol/server-sequential-thinking` | Helps with complex planning | Enable for planning agents |
| Web fetch | `mcp-server-fetch` | Fetch docs/pages as markdown | Respect robots.txt by default |
| Browser automation | `@playwright/mcp@latest` | UI flow and accessibility inspection | Limit origins when possible |
| GitHub | `ghcr.io/github/github-mcp-server` | Issues, PRs, repos, actions | Use minimal PAT scopes |
| Library docs | `@upstash/context7-mcp@latest` | Current docs and API examples | API key recommended |

## Selection rule

Use MCP only when it materially improves correctness. Do not load many MCP servers at once for small tasks.
