#!/usr/bin/env bash
set -euo pipefail

check() {
  local name="$1"
  local cmd="$2"
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "[ok] $name: $(command -v "$cmd")"
  else
    echo "[missing] $name: install or skip features requiring '$cmd'"
  fi
}

echo "ChatGPT Codex Orchestrator doctor"
echo "Repository: $(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
check "node" node
check "npm" npm
check "git" git
check "GitHub CLI" gh
check "Codex CLI/app-server" codex
check "ngrok" ngrok
check "Cloudflare tunnel" cloudflared

echo
if [ -f bridge/.env ]; then
  echo "[ok] bridge/.env exists"
else
  echo "[missing] bridge/.env does not exist. Run: cp bridge/.env.example bridge/.env"
fi

echo
node -v >/dev/null 2>&1 && echo "Node version: $(node -v)"
npm -v >/dev/null 2>&1 && echo "npm version: $(npm -v)"
git --version >/dev/null 2>&1 && git --version || true
codex --version >/dev/null 2>&1 && codex --version || true
