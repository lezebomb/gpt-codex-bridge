# Strategy Notes

## Why not just use Codex multi-agent mode?

Codex subagents are useful when the task is already engineering-shaped: inspect, implement, test, review. The ChatGPT orchestrator is useful before and after that step:

1. It translates vague product needs into engineering tasks.
2. It chooses role protocols without overloading Codex with every possible concern.
3. It keeps user-facing decisions traceable.
4. It can integrate non-code context: product requirements, UI taste, business constraints, reports, notes, screenshots, and documentation.
5. It reviews Codex output in a more PM/designer/reviewer style rather than only as a coding agent.

The system is not valuable if it only generates a better prompt. It is valuable if it forms a loop:

```text
ChatGPT plans -> Codex implements -> ChatGPT reviews -> user approves -> Codex continues
```

## Difference between ChatGPT roles and Codex skills

| Layer | Purpose | Typical output |
|---|---|---|
| ChatGPT role protocols | Decide scope, priorities, acceptance criteria, and review lens | task packet, plan, risk list, review feedback |
| Codex skills | Give Codex task-specific implementation procedure | code changes, commands, tests, diff summaries |
| Codex subagents | Parallelize implementation and technical analysis | independent technical findings and patches |

## Recommended use

Use ChatGPT role protocols for task shaping and review. Use Codex skills for execution discipline. Use Codex subagents only for large tasks where parallel technical investigation is worth the extra token and time cost.
