#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: scripts/copy-skills-to-repo.sh /path/to/target/repo" >&2
  exit 1
fi

TARGET="$1"
mkdir -p "$TARGET/.agents/skills"
cp -R .agents/skills/* "$TARGET/.agents/skills/"

echo "Copied skills to $TARGET/.agents/skills"
