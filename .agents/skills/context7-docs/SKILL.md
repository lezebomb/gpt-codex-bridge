---
name: context7-docs
description: Retrieve current library and framework documentation before using uncertain APIs. Use when implementing with Next.js, React, Tailwind, Supabase, Prisma, Playwright, OpenAI, MCP, or any package where version-specific API details matter.
---

# Context7 Docs

When a task depends on library APIs and Context7 is installed:

1. Resolve the library ID.
2. Query documentation for the exact task and version.
3. Use retrieved docs to avoid hallucinated APIs.
4. Cite the library/version in the implementation notes when relevant.

If Context7 is unavailable, inspect local package versions and existing project usage before coding.
