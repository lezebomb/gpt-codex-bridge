# Set up Codex Skills Once

You do not need to copy skills into every project.

Codex can discover skills from multiple scopes:

- repository scope: `<repo>/.agents/skills`
- user scope on Windows: `$env:USERPROFILE\.agents\skills`

For personal default skills on Windows PowerShell:

```powershell
$source = Join-Path (Get-Location) ".agents\\skills"
$target = "$env:USERPROFILE\.agents\skills"
New-Item -ItemType Directory -Force -Path $target | Out-Null
Copy-Item -Path "$source\*" -Destination $target -Recurse -Force
```

Repository-specific skills should still live inside a target repository when they encode project conventions that should travel with the codebase.

## Recommended policy

- Put general engineering skills in `$env:USERPROFILE\.agents\skills`.
- Put project-specific rules in `<repo>/.agents/skills` and `<repo>/AGENTS.md`.
- Keep the number of globally installed skills modest. Too many global skills can make implicit matching noisy.
