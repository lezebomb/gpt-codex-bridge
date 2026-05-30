#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_URL="${BASE_URL:-http://localhost:8787}"
TOKEN="${BRIDGE_TOKEN:-change-me}"
DEMO_PATH="$REPO_ROOT/examples/demo-project"
TMP_DIR="$REPO_ROOT/.tmp-test"
mkdir -p "$TMP_DIR"

cd "$REPO_ROOT"
echo "== Layout check =="
scripts/validate-layout.sh

echo "== Bridge build =="
(cd bridge && npm install >/tmp/ccb-npm-install.log 2>&1 && npm run build)

echo "== Starting bridge on $BASE_URL =="
(cd bridge && BRIDGE_TOKEN="$TOKEN" BRIDGE_PERMISSION_MODE=manual_review CODEX_EXECUTION=dry-run npm run dev > "$TMP_DIR/bridge.log" 2>&1 & echo $! > "$TMP_DIR/bridge.pid")
sleep 2
cleanup() {
  if [ -f "$TMP_DIR/bridge.pid" ]; then
    kill "$(cat "$TMP_DIR/bridge.pid")" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

auth=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

echo "== Health =="
curl -fsS "$BASE_URL/health" >/tmp/ccb-health.json
cat /tmp/ccb-health.json

echo "== Register demo project =="
PROJECT_JSON=$(curl -fsS -X POST "$BASE_URL/projects" "${auth[@]}" -d "{\"name\":\"demo-project\",\"path\":\"$DEMO_PATH\",\"allowShell\":false}")
echo "$PROJECT_JSON" > /tmp/ccb-project.json
PROJECT_ID=$(node -e 'const fs=require("fs"); const x=JSON.parse(fs.readFileSync("/tmp/ccb-project.json","utf8")); console.log(x.project.id)')
echo "PROJECT_ID=$PROJECT_ID"

echo "== Tree, file read, context pack =="
curl -fsS "$BASE_URL/projects/$PROJECT_ID/tree?limit=50" "${auth[@]}" >/tmp/ccb-tree.json
curl -fsS "$BASE_URL/projects/$PROJECT_ID/files/read?path=src/App.tsx" "${auth[@]}" >/tmp/ccb-file.json
curl -fsS -X POST "$BASE_URL/projects/$PROJECT_ID/context-pack" "${auth[@]}" -d '{"paths":["src/App.tsx","src/styles.css"],"includeTree":true,"includeGitStatus":true,"includeDiff":false}' >/tmp/ccb-context.json

PATCH_CONTENT=$(node - <<'NODE'
const fs=require('fs');
const data=JSON.parse(fs.readFileSync('/tmp/ccb-file.json','utf8'));
const content=data.file.content.replace('Local demo app for validating the bridge workflow.','Local demo app for validating the complete v1.0 bridge workflow.');
process.stdout.write(JSON.stringify(content));
NODE
)

echo "== Web patch diff/apply/revert =="
PATCH_JSON=$(curl -fsS -X POST "$BASE_URL/web-patches" "${auth[@]}" -d "{\"projectId\":\"$PROJECT_ID\",\"title\":\"Smoke patch\",\"rationale\":\"v1.0 smoke test\",\"changes\":[{\"filePath\":\"src/App.tsx\",\"mode\":\"overwrite\",\"content\":$PATCH_CONTENT}]}")
echo "$PATCH_JSON" >/tmp/ccb-patch.json
PATCH_ID=$(node -e 'const fs=require("fs"); const x=JSON.parse(fs.readFileSync("/tmp/ccb-patch.json","utf8")); console.log(x.patch.id)')
curl -fsS "$BASE_URL/web-patches/$PATCH_ID/diff" "${auth[@]}" >/tmp/ccb-diff.json
curl -fsS -X POST "$BASE_URL/web-patches/$PATCH_ID/apply" "${auth[@]}" -d '{"confirm":true}' >/tmp/ccb-apply.json
curl -fsS -X POST "$BASE_URL/web-patches/$PATCH_ID/revert" "${auth[@]}" -d '{"confirm":true}' >/tmp/ccb-revert.json

echo "== Codex dry-run job and verification job =="
curl -fsS -X POST "$BASE_URL/codex/jobs" "${auth[@]}" -d "{\"projectId\":\"$PROJECT_ID\",\"title\":\"Dry run job\",\"task\":\"Inspect the demo app and report files.\",\"roles\":[\"qa_reviewer\"],\"safetyLevel\":1}" >/tmp/ccb-job.json
JOB_ID=$(node -e 'const fs=require("fs"); const x=JSON.parse(fs.readFileSync("/tmp/ccb-job.json","utf8")); console.log(x.job.id)')
curl -fsS -X POST "$BASE_URL/codex/jobs/$JOB_ID/approve" "${auth[@]}" -d '{"runNow":true,"note":"smoke test"}' >/tmp/ccb-job-run.json
curl -fsS "$BASE_URL/projects/$PROJECT_ID/test-plan" "${auth[@]}" >/tmp/ccb-test-plan.json
curl -fsS -X POST "$BASE_URL/projects/$PROJECT_ID/test-job" "${auth[@]}" -d '{"scope":"smoke test verification","runImmediately":false}' >/tmp/ccb-test-job.json

echo "== Repair proposal =="
curl -fsS -X POST "$BASE_URL/repairs" "${auth[@]}" -d "{\"projectId\":\"$PROJECT_ID\",\"sourceKind\":\"manual\",\"errorSummary\":\"smoke test synthetic error\",\"conciseDiagnosis\":\"This is a generated test proposal.\",\"solution\":\"Create a dry-run repair job only.\",\"executionPlan\":[\"Create a Codex repair task\",\"Do not modify files in dry-run mode\"],\"safetyLevel\":1}" >/tmp/ccb-repair.json

curl -fsS "$BASE_URL/diagnostics" "${auth[@]}" >/tmp/ccb-diagnostics.json
curl -fsS "$BASE_URL/support-bundle" "${auth[@]}" >/tmp/ccb-support.json

echo
cat <<MSG
Full local dry-run test passed.
Artifacts:
  /tmp/ccb-health.json
  /tmp/ccb-project.json
  /tmp/ccb-context.json
  /tmp/ccb-diff.json
  /tmp/ccb-job-run.json
  /tmp/ccb-diagnostics.json
Bridge log:
  $TMP_DIR/bridge.log
MSG
