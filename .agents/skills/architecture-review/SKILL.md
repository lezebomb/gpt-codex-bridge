---
name: architecture-review
description: Review system design before coding. Use for multi-file changes, API design, refactors, migrations, dependency choices, integration boundaries, or any task where Codex should inspect the repository and produce a safe technical implementation plan.
---

# Architecture Review

Inspect existing structure before proposing changes. Output:

- Current architecture assumptions
- Files/modules to inspect
- Proposed file impact map
- API/data contracts
- Dependency decisions
- Migration or backward compatibility risks
- Rollback plan
- Implementation phases

Prefer smallest safe change. Do not introduce new dependencies without justification.
