#!/usr/bin/env bash
set -euo pipefail

test -f README.md
test -f QUICKSTART.md
test -f gpts/project-orchestrator/instructions.md
test -f gpts/project-orchestrator/gpt-builder-fields.yaml
test -d roles
test -d .agents/skills
test -f bridge/openapi/action-schema.yaml
test -f bridge/public/index.html
test -f bridge/public/styles.css
test -f bridge/public/app.js
test -f bridge/README.md
test -f docs/babysitter-setup-guide.md
test -f docs/full-test-matrix.md
test -f docs/troubleshooting.md
test -f docs/feature-map.md
test -f docs/codex-app-integration.md
test -f docs/account-switching.md
test -f docs/bounded-cross-review.md
test -f docs/access-modes.md
test -f docs/logging-diagnostics.md
test -f docs/testing-guide.md
test -f docs/ui-design.md
test -f codex/config.example.toml
test -d examples/demo-project
test -x scripts/doctor.sh
test -x scripts/full-local-test.sh
test -x scripts/create-release-zip.sh

echo "Layout OK"
