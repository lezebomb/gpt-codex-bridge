# Role Boundaries: ChatGPT vs Codex

This project deliberately separates planning roles from implementation execution.

## ChatGPT side

ChatGPT should act as the orchestration layer:

- clarify the user's goal;
- select the minimum necessary role protocols;
- build a task packet;
- inspect project metadata through the bridge;
- decide whether the task is ready for execution;
- review Codex output, logs, tests, and risks;
- ask the user for approval on high-risk steps.

ChatGPT should not pretend to have changed files unless a bridge or Codex result proves it.

## Role protocols

Role protocols are planning and review lenses. They are not separate workers by default.

Examples:

- Backend Engineer protocol defines API design and backend acceptance criteria.
- Frontend Engineer protocol defines component and UI implementation criteria.
- QA Reviewer protocol defines what must be tested.

These protocols help ChatGPT write better Codex tasks and review results. They are not meant to replace Codex.

## Codex side

Codex should remain the implementation agent:

- read and edit files;
- run commands and tests;
- use repository-specific instructions;
- use .agents/skills;
- create reviewable diffs;
- report changed files, commands, tests, and unresolved blockers.

## Why keep both?

If Codex does everything alone, it can still complete many tasks. The bridge adds value when the work needs product judgment, role routing, traceability, user-friendly review, and multi-step approval before changing local code.

## Practical rule

- ChatGPT decides what should be done and whether it is acceptable.
- Codex performs the actual code modification and local verification.
