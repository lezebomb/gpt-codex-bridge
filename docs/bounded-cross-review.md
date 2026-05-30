# Bounded ChatGPT Web ↔ Codex Cross-Review

Problem: ChatGPT Web may produce better UI/product-facing code in some cases, while Codex is better at local integration, tests, and repository-wide consistency. Letting them critique each other without a rule can waste time, context, and quota.

## Rule

Every cross-review has a hard round limit:

- Default: 2 rounds.
- Maximum: 3 rounds.
- After the limit, decide: `web`, `codex`, `hybrid`, or `needs_human`.

## Recommended decision policy

| Situation | Decision |
|---|---|
| ChatGPT Web patch is visually/UX better and Codex finds no integration issue | `web` |
| Codex implementation passes tests and Web critique is mostly stylistic | `codex` |
| Web has better layout but Codex has necessary imports/tests/fixes | `hybrid` |
| Security, auth, payment, migration, or uncertain production risk | `needs_human` |

## Workflow

1. ChatGPT Web writes or proposes a small patch.
2. Bridge applies it only after user approval.
3. Codex reviews/tests/fixes through a job.
4. Create a cross-review session.
5. Add at most two summarized rounds.
6. Make a final decision.

Do not ask the two systems to debate indefinitely. Each side must produce concise, testable objections.
