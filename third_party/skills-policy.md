# Third-party Skills Policy

Do not automatically copy random GitHub skills into this repository.

Reasons:

- Skills can contain executable scripts.
- Natural-language `SKILL.md` files can manipulate agent behavior.
- Unreviewed skills may request broad filesystem, shell, network, or token access.

## Intake checklist

Before adopting a third-party skill:

1. Check repository owner, commit history, license, and open issues.
2. Read every `SKILL.md` file.
3. Inspect scripts for shell execution, network calls, credential reads, and file deletion.
4. Run in a disposable sandbox first.
5. Give each skill the narrowest possible scope.
6. Prefer instruction-only skills unless scripts are necessary.

## Preferred approach

For this project, keep role and workflow skills authored in-repo. Use third-party MCP servers through explicit configuration rather than vendoring unknown skills.
