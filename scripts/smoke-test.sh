#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8787}"
TOKEN="${BRIDGE_TOKEN:-change-me}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEMO_PATH="$REPO_ROOT/examples/demo-project"

echo "== Health =="
curl -sS "$BASE_URL/health"
echo

echo "== Register demo project =="
curl -sS -X POST "$BASE_URL/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"demo-project\",\"path\":\"$DEMO_PATH\",\"allowShell\":false}"
echo

echo "== Projects =="
curl -sS "$BASE_URL/projects" -H "Authorization: Bearer $TOKEN"
echo

echo "== Roles =="
curl -sS "$BASE_URL/roles" -H "Authorization: Bearer $TOKEN" | head -c 1000
echo

echo "== Skills =="
curl -sS "$BASE_URL/skills" -H "Authorization: Bearer $TOKEN" | head -c 1000
echo

echo "Smoke test completed."
