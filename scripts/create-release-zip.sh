#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-$REPO_ROOT/../chatgpt-codex-orchestrator-v1.0.zip}"
cd "$(dirname "$REPO_ROOT")"
rm -f "$OUT"
zip -r "$OUT" "$(basename "$REPO_ROOT")" \
  -x "*/node_modules/*" "*/dist/*" "*/data/*" "*/.tmp-test/*" "*/.git/*" "*/.DS_Store" >/tmp/ccb-zip.log
printf 'Created %s\n' "$OUT"
