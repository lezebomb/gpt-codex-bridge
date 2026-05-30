#!/usr/bin/env bash
set -euo pipefail

# Suggested MCP installs for Codex CLI. Review each before running.
# Replace /ABS/PATH/TO/ALLOWED/PROJECTS with your project root.

codex mcp add sequential-thinking npx -y @modelcontextprotocol/server-sequential-thinking
codex mcp add playwright npx "@playwright/mcp@latest"

# Filesystem should be manually configured so you can constrain allowed directories:
# codex mcp add filesystem npx -y @modelcontextprotocol/server-filesystem /ABS/PATH/TO/ALLOWED/PROJECTS

# Git server usually uses uvx:
# codex mcp add git uvx mcp-server-git

# Fetch server:
# codex mcp add fetch uvx mcp-server-fetch

# Context7:
# codex mcp add context7 npx -y @upstash/context7-mcp@latest
