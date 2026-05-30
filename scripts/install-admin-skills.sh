#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT_DIR/.agents/skills"
DEST="/etc/codex/skills"

if [ ! -d "$SRC" ]; then
  echo "source skills folder not found: $SRC" >&2
  exit 1
fi

mkdir -p "$DEST"
rsync -a --delete "$SRC/" "$DEST/"

echo "Installed Codex skills to $DEST"
echo "Restart Codex if the new skills do not appear."
