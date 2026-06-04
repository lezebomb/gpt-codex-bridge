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
  console.log(`health ok: ${health.body.version}`);

  if (!token) {
    const bootstrap = await request("GET", "/bootstrap", undefined, "");
    assert(bootstrap.response.ok, `/bootstrap failed: ${bootstrap.response.status}`);
    token = bootstrap.body.token;
    console.log("bootstrap ok");
  }

  const config = await must("GET", "/config");
  assert(config.settings?.permissionMode, "missing settings.permissionMode");
  console.log(`config ok: ${config.execution}`);

  const pluginCenter = await must("GET", "/mcp-center");
  assert(pluginCenter.summary?.plugins?.some((plugin) => plugin.id === "filesystem-restricted" && plugin.enabled === true), "built-in filesystem plugin should stay enabled");
  assert(pluginCenter.summary?.plugins?.some((plugin) => plugin.id === "context7"), "context7 optional plugin should be listed");
  const enabledPlugin = await must("POST", "/mcp-center/plugins/context7/enable", {});
  assert(enabledPlugin.summary?.plugins?.some((plugin) => plugin.id === "context7" && plugin.enabled === true), "context7 enable did not persist");
  const disabledPlugin = await must("POST", "/mcp-center/plugins/context7/disable", {});
  assert(disabledPlugin.summary?.plugins?.some((plugin) => plugin.id === "context7" && plugin.enabled === false), "context7 disable did not persist");
  console.log("mcp plugin center ok");

  const roots = await must("GET", "/fs/roots");
  assert(Array.isArray(roots.roots) && roots.roots.length > 0, "/fs/roots missing roots");
  console.log(`roots ok: ${roots.roots.length}`);

  const selected = await must("POST", "/projects/select", { path: demoProjectPath, displayName: "demo-project", allowShell: false });
  const project = selected.project;
  assert(project?.id, "/projects/select missing project id");
  console.log(`project selected: ${project.id}`);

  const inspected = await must("GET", `/projects/${project.id}/inspect`);
  assert(inspected.project?.project?.id || inspected.project?.project?.path, "inspect response missing project details");
  console.log("inspect ok");

  const file = await must("GET", `/projects/${project.id}/files/read?path=${encodeURIComponent("src/App.tsx")}`);
  assert(file.file?.content?.includes("function") || file.file?.content?.includes("export"), "read_file missing expected content");
  console.log("file read ok");

  const task = await must("POST", "/tasks", {
    projectId: project.id,
    taskTitle: "Smoke webagent task",
    taskGoal: "Update a small README marker through the new task flow.",
    targetFiles: ["README.md"],
    executorMode: "webagent",
    executorPolicy: "save_codex_quota"
  });
  assert(task.task?.id, "task creation missing task id");
  console.log(`task ok: ${task.task.id}`);

  const contextPack = await must("POST", `/projects/${project.id}/context-pack`, {
    taskId: task.task.id,
    goal: task.task.taskGoal,
    paths: ["README.md"],
    includeTree: true,
    includeGitStatus: true,
    includeDiff: false
  });
  assert(contextPack.contextPackId, "context pack missing id");
  console.log(`context pack ok: ${contextPack.contextPackId}`);

  const originalReadme = fs.readFileSync(demoReadmePath, "utf8");
  const marker = `Bridge smoke marker ${Date.now()}`;
  const patchedReadme = `${originalReadme.trimEnd()}\n\n${marker}\n`;
  let patchId = "";
  try {
    const patch = await must("POST", "/web-patches", {
      projectId: project.id,
      taskId: task.task.id,
      title: "Smoke README patch",
      rationale: "REST smoke test patch.",
      changes: [{ filePath: "README.md", mode: "overwrite", content: patchedReadme }]
    });
    patchId = patch.patch.id;
    console.log(`patch created: ${patchId}`);

    const diff = await must("GET", `/web-patches/${patchId}/diff`);
    assert(JSON.stringify(diff.diff).includes(marker), "patch diff missing marker");
    console.log("patch diff ok");

    const applied = await must("POST", `/web-patches/${patchId}/apply`, { confirm: true });
    assert(applied.result.applied.length > 0, "patch apply did not return applied files");
    assert(fs.readFileSync(demoReadmePath, "utf8").includes(marker), "patched README missing marker");
    console.log("patch apply ok");

    const reverted = await must("POST", `/web-patches/${patchId}/revert`, { confirm: true });
    assert(reverted.result.reverted.length > 0, "patch revert did not return reverted files");
    assert(fs.readFileSync(demoReadmePath, "utf8") === originalReadme, "README did not return to original content");
    console.log("patch revert ok");
  } finally {
    if (fs.existsSync(demoReadmePath) && fs.readFileSync(demoReadmePath, "utf8") !== originalReadme) {
      fs.writeFileSync(demoReadmePath, originalReadme, "utf8");
    }
  }

  const webJob = await must("POST", `/tasks/${task.task.id}/executions`, { executorMode: "webagent", runImmediately: true });
  assert(webJob.job?.status === "completed", `webagent execution should complete, got ${webJob.job?.status}`);
  console.log(`webagent execution ok: ${webJob.job.id}`);

  const codexTask = await must("POST", "/tasks", {
    projectId: project.id,
    taskTitle: "Smoke codex task",
    taskGoal: "Run a dry-run Codex execution packet.",
    targetFiles: ["README.md"],
    executorMode: "codex",
    executorPolicy: "manual"
  });
  const codexJob = await must("POST", `/tasks/${codexTask.task.id}/executions`, { executorMode: "codex", runImmediately: false });
  assert(codexJob.job?.status === "needs_approval", `codex job should require approval, got ${codexJob.job?.status}`);
  const codexApproved = await must("POST", `/execution-jobs/${codexJob.job.id}/approve-run`, { runNow: true });
  assert(codexApproved.job?.status === "completed", `codex dry-run should complete, got ${codexApproved.job?.status}`);
  console.log(`codex dry-run ok: ${codexApproved.job.id}`);

  const shellCommand = await must("POST", "/run-shell-command", {
    projectId: project.id,
    taskId: task.task.id,
    command: "git status --short --branch",
    runImmediately: false
  });
  assert(shellCommand.command?.id, "shell command missing id");
  const shellApproved = await must("POST", `/shell-commands/${shellCommand.command.id}/approve-run`, { runNow: true });
  assert(shellApproved.command?.status === "completed", "shell command did not complete");
  console.log(`shell command ok: ${shellApproved.command.id}`);

  const missing = await request("GET", `/projects/${project.id}/files/read?path=${encodeURIComponent("src/does-not-exist.tsx")}`);
  assert(!missing.response.ok, "missing file request should fail");
  assert(missing.body.requestId, "missing file error should include requestId");
  console.log(`intentional error ok: requestId=${missing.body.requestId}`);

  const logs = await must("GET", `/logs?limit=100&requestId=${encodeURIComponent(missing.body.requestId)}`);
  assert(Array.isArray(logs.logs) && logs.logs.length > 0, "logs should contain the intentional error requestId");
  console.log("logs ok");

  const analysis = await must("GET", `/errors/latest?requestId=${encodeURIComponent(missing.body.requestId)}`);
  assert(analysis.analysis?.errorSummary, "error analysis missing summary");
  console.log("error analysis ok");

  const repair = await must("POST", "/repairs", {
    projectId: project.id,
    taskId: task.task.id,
    sourceRequestId: missing.body.requestId,
    sourceKind: "http_error",
    errorSummary: "Missing demo file in REST smoke test.",
    conciseDiagnosis: "The requested file path does not exist in the demo project.",
    solution: "Use an existing relative path or create a new file deliberately.",
    executionPlan: ["Verify the file path.", "Use a valid project-relative path."],
    safetyLevel: 1
  });
  assert(repair.repair?.status === "needs_approval", "repair proposal should wait for approval");
  console.log(`repair proposal ok: ${repair.repair.id}`);

  console.log("Smoke test passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
