# Architecture

## Target workflow

```text
User in ChatGPT web
  -> Project Orchestrator GPT
  -> role protocol routing
  -> Bridge API / ChatGPT Action / future Apps SDK MCP server
  -> local Codex SDK / CLI
  -> local repo in isolated branch/worktree
  -> diff, logs, tests, screenshots
  -> ChatGPT review and next iteration
```

## Components

### 1. Project Orchestrator GPT

Owns conversation, scope control, role selection, planning, Codex job creation, result review, and user approval gates.

### 2. Role protocols

Markdown protocols that constrain each role to a narrow job. They prevent the main GPT from becoming a vague all-in-one persona.

### 3. Codex skills

Reusable `SKILL.md` packages installed into Codex so Codex can consistently follow task-specific workflows.

### 4. Local bridge

A local server exposing a small task API. The GPT calls it through Actions or an Apps SDK/MCP integration. The bridge controls project allowlists, jobs, logs, and Codex execution mode.

### 5. MCP servers

MCP is used for local repo/file/Git/browser/docs/GitHub tooling. Do not enable all toolsets by default.

## Modes

### Mode A: Actions MVP

Use a Custom GPT Action with `bridge/openapi/action-schema.yaml`. This is simplest and enough for a demo.

### Mode B: Apps SDK / MCP product route

Use a ChatGPT App with MCP tools and UI widgets. This is the intended long-term route for a public product.

### Mode C: Manual specialist GPTs

Specialist GPTs can manually read/write shared task records through the same bridge. This gives specialization without unsupported GPT-to-GPT calls.
