# Source references checked during scaffold design

- OpenAI GPT builder docs: recommended model, knowledge, capabilities, Apps, Actions.
- OpenAI Apps SDK docs: ChatGPT app framework and MCP tool/UI integration path.
- OpenAI Codex SDK docs: programmatic control of local Codex agents.
- OpenAI Codex Agent Skills docs: `SKILL.md` structure, progressive loading, install locations.
- GitHub official MCP server.
- Model Context Protocol reference servers: filesystem, git, fetch, sequential thinking.
- Microsoft Playwright MCP server.
- Upstash Context7 MCP/CLI.

Do not vendor third-party MCP or skills without reviewing license, provenance, and security posture.

## v0.5 references

- OpenAI Codex App Server: https://developers.openai.com/codex/app-server
  - Used for JSON-RPC, stdio/app-server transport, thread/turn streaming, approvals, account/rate-limit endpoints.
- OpenAI Codex Skills: https://developers.openai.com/codex/skills
  - Used for repo/user/admin skill locations and skill invocation rules.
- OpenAI Codex CLI: https://developers.openai.com/codex/cli
  - Used for CLI execution mode assumptions.
