import fs from "node:fs";
import path from "node:path";

const baseUrl = (process.env.BRIDGE_BASE_URL || `http://localhost:${process.env.BRIDGE_PORT || 8787}`).replace(/\/$/, "");
const repoRoot = path.resolve(process.cwd(), "..");
const demoProjectPath = path.join(repoRoot, "examples", "demo-project");
const demoReadmePath = path.join(demoProjectPath, "README.md");
let token = process.env.BRIDGE_PAIRING_CODE || process.env.BRIDGE_TOKEN || "";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readBody(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function request(method, route, body, tokenOverride = token) {
  const headers = { Accept: "application/json" };
  if (tokenOverride) headers.Authorization = `Bearer ${tokenOverride}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const parsed = await readBody(response);
  return { response, body: parsed };
}

async function must(method, route, body) {
  const result = await request(method, route, body);
  assert(result.response.ok, `${method} ${route} failed: ${result.response.status} ${JSON.stringify(result.body)}`);
  return result.body;
}

async function main() {
  console.log(`Smoke target: ${baseUrl}`);

  const health = await request("GET", "/health", undefined, "");
  assert(health.response.ok, `/health failed: ${health.response.status}`);
  assert(health.body?.ok === true, "/health did not return ok=true");
  console.log(`health ok: execution=${health.body.execution}; permission=${health.body.permissionMode}`);

  if (!token) {
    const bootstrap = await request("GET", "/bootstrap", undefined, "");
    assert(bootstrap.response.ok, `/bootstrap failed: ${bootstrap.response.status}`);
    assert(Boolean(bootstrap.body?.token), "/bootstrap missing token");
    token = bootstrap.body.token;
    console.log(`bootstrap ok: execution=${bootstrap.body.execution}; token=${bootstrap.body.tokenPreview || "loaded"}`);
  }

  const wrongToken = await request("GET", "/config", undefined, "wrong-token");
  assert(wrongToken.response.status === 401, `/config with wrong token should be 401, got ${wrongToken.response.status}`);
  assert(Boolean(wrongToken.body?.requestId), "401 response should include requestId");
  console.log(`wrong token rejected with requestId=${wrongToken.body.requestId}`);

  const config = await must("GET", "/config");
  assert(Boolean(config.settings?.permissionMode), "/config missing settings.permissionMode");
  console.log(`config ok: execution=${config.execution}; permission=${config.settings.permissionMode}`);

  const roots = await must("GET", "/fs/roots");
  assert(Array.isArray(roots.roots), "/fs/roots missing roots");
  console.log(`folder roots ok: ${roots.roots.length}`);

  const selected = await must("POST", "/projects/select", { path: demoProjectPath, displayName: "demo-project", allowShell: false });
  const project = selected.project;
  assert(project?.id, "/projects/select missing project id");
  console.log(`project selected: ${project.id}`);

  const inspected = await must("GET", `/projects/${project.id}/inspect`);
  assert(inspected.project?.id || inspected.path, "inspect_project response missing project data");
  console.log("inspect ok");

  const file = await must("GET", `/projects/${project.id}/files/read?path=${encodeURIComponent("src/App.tsx")}`);
  assert(file.file?.content?.includes("function") || file.file?.content?.includes("export"), "file read did not include expected source text");
  console.log("file read ok: src/App.tsx");

  const originalReadme = fs.readFileSync(demoReadmePath, "utf8");
  const marker = `Bridge smoke marker ${Date.now()}`;
  const patchedReadme = `${originalReadme.trimEnd()}\n\n${marker}\n`;
  let patchId = "";
  try {
    const patch = await must("POST", "/web-patches", {
      projectId: project.id,
      title: `Smoke README patch ${Date.now()}`,
      rationale: "REST smoke test patch.",
      changes: [{ filePath: "README.md", mode: "overwrite", content: patchedReadme }]
    });
    patchId = patch.patch.id;
    console.log(`patch created: ${patchId}`);

    const diff = await must("GET", `/web-patches/${patchId}/diff`);
    assert(JSON.stringify(diff.diff).includes(marker), "patch diff missing marker");
    console.log("patch diff ok");

    const applied = await must("POST", `/web-patches/${patchId}/apply`, { confirm: true });
    assert(applied.patch.status === "applied", "patch was not applied");
    assert(fs.readFileSync(demoReadmePath, "utf8").includes(marker), "patched README missing marker");
    console.log("patch apply ok");

    const reverted = await must("POST", `/web-patches/${patchId}/revert`, { confirm: true });
    assert(reverted.patch.status === "reverted", "patch was not reverted");
    assert(fs.readFileSync(demoReadmePath, "utf8") === originalReadme, "README did not return to original content");
    console.log("patch revert ok");
  } finally {
    if (fs.existsSync(demoReadmePath) && fs.readFileSync(demoReadmePath, "utf8") !== originalReadme) {
      fs.writeFileSync(demoReadmePath, originalReadme, "utf8");
    }
  }

  const job = await must("POST", "/codex/jobs", {
    projectId: project.id,
    title: `Smoke dry-run job ${Date.now()}`,
    task: "Dry-run verification from REST smoke test.",
    roles: ["qa_reviewer"],
    safetyLevel: 1,
    runImmediately: true
  });
  assert(job.job.status === "completed", `dry-run job should complete, got ${job.job.status}`);
  console.log(`dry-run job ok: ${job.job.id}`);

  const missing = await request("GET", `/projects/${project.id}/files/read?path=${encodeURIComponent("src/does-not-exist.tsx")}`);
  assert(!missing.response.ok, "missing file request should fail");
  assert(missing.body.requestId, "missing file error should include requestId");
  console.log(`intentional error ok: requestId=${missing.body.requestId}`);

  const logs = await must("GET", `/logs?limit=100`);
  assert(Array.isArray(logs.logs), "logs endpoint missing logs");
  assert(logs.logs.some((entry) => entry.requestId === missing.body.requestId), "logs should contain intentional error requestId");
  console.log("logs ok");

  const latest = await must("GET", `/errors/latest?requestId=${encodeURIComponent(missing.body.requestId)}`);
  assert(latest.errors?.length, "latest errors should include intentional error");

  const repair = await must("POST", "/repairs", {
    projectId: project.id,
    sourceRequestId: missing.body.requestId,
    sourceKind: "http_error",
    errorSummary: "Missing demo file in REST smoke test.",
    conciseDiagnosis: "The requested file path does not exist in the demo project.",
    solution: "Use an existing relative path or create a Codex repair job after approval.",
    executionPlan: ["Verify the path.", "Update the request or add the missing file if needed."],
    safetyLevel: 1
  });
  assert(repair.repair.status === "needs_approval", "repair proposal should wait for approval");
  console.log(`repair proposal ok: ${repair.repair.id}`);

  console.log("Smoke test passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
