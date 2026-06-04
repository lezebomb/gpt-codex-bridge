import path from "node:path";

const baseUrl = (process.env.BRIDGE_BASE_URL || `http://localhost:${process.env.BRIDGE_PORT || 8787}`).replace(/\/$/, "");
const repoRoot = path.resolve(process.cwd(), "..");
const demoProjectPath = path.join(repoRoot, "examples", "demo-project");
let token = process.env.BRIDGE_PAIRING_CODE || process.env.BRIDGE_TOKEN || "";
let rpcId = 1;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function jsonOrText(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/event-stream")) {
      const payload = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("");
      if (payload) {
        return JSON.parse(payload);
      }
    }
    return { raw: text };
  }
}

async function loadToken() {
  if (token) return token;
  const response = await fetch(`${baseUrl}/bootstrap`);
  const body = await jsonOrText(response);
  assert(response.ok, `/bootstrap failed: ${response.status}`);
  assert(body.token, "/bootstrap did not return a local pairing code");
  token = body.token;
  return token;
}

async function mcpPost(payload, sessionId = "") {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    Authorization: `Bearer ${token}`
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  const response = await fetch(`${baseUrl}/mcp`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  const body = await jsonOrText(response);
  if (!response.ok || body.error) {
    throw new Error(`MCP ${payload.method || "notification"} failed: HTTP ${response.status} ${JSON.stringify(body)}`);
  }
  return { body, sessionId: response.headers.get("mcp-session-id") || sessionId };
}

async function callTool(sessionId, name, args = {}) {
  const response = await mcpPost({
    jsonrpc: "2.0",
    id: rpcId++,
    method: "tools/call",
    params: { name, arguments: args }
  }, sessionId);
  const result = response.body.result;
  assert(result, `${name} did not return a result`);
  if (result.isError) throw new Error(`${name} returned tool error: ${result.content?.[0]?.text || JSON.stringify(result)}`);
  return result.structuredContent || result;
}

async function main() {
  await loadToken();
  console.log(`MCP smoke target: ${baseUrl}/mcp`);

  const init = await mcpPost({
    jsonrpc: "2.0",
    id: rpcId++,
    method: "initialize",
    params: {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: { name: "bridge-mcp-smoke", version: "2.0.0" }
    }
  });
  const sessionId = init.sessionId;
  assert(sessionId, "initialize did not return mcp-session-id");
  await mcpPost({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }, sessionId);

  const toolsResponse = await mcpPost({ jsonrpc: "2.0", id: rpcId++, method: "tools/list", params: {} }, sessionId);
  const tools = toolsResponse.body.result?.tools || [];
  assert(tools.length >= 36, `expected at least 36 tools, got ${tools.length}`);
  assert(tools.some((tool) => tool.name === "create_task"), "create_task missing");
  assert(tools.some((tool) => tool.name === "create_execution_job"), "create_execution_job missing");
  assert(tools.some((tool) => tool.name === "retrieve_context"), "retrieve_context missing");
  assert(tools.some((tool) => tool.name === "create_task_branch"), "create_task_branch missing");
  console.log(`tools/list ok: ${tools.length} tools`);

  const status = await callTool(sessionId, "get_bridge_status");
  assert(status.bridgeVersion, "get_bridge_status missing bridgeVersion");
  console.log(`status ok: mode=${status.defaultExecutorMode}`);

  const folders = await callTool(sessionId, "browse_folders");
  assert(Array.isArray(folders.roots), "browse_folders did not return roots");
  console.log(`browse_folders ok: ${folders.roots.length} roots`);

  const selected = await callTool(sessionId, "select_project", { path: demoProjectPath, displayName: "demo-project" });
  assert(selected.projectId, "select_project missing projectId");
  console.log(`select_project ok: ${selected.projectId}`);

  const indexed = await callTool(sessionId, "index_project", { projectId: selected.projectId, force: true });
  assert(indexed.index?.indexedFiles > 0, "index_project should index files");
  console.log(`index_project ok: ${indexed.index.indexedFiles}`);

  const retrieved = await callTool(sessionId, "retrieve_context", {
    projectId: selected.projectId,
    query: "Start workflow",
    purpose: "MCP smoke"
  });
  assert(retrieved.retrievedContext?.relevantFiles?.length > 0, "retrieve_context should return relevant files");
  console.log(`retrieve_context ok: ${retrieved.retrievedContext.relevantFiles.length}`);

  const task = await callTool(sessionId, "create_task", {
    projectId: selected.projectId,
    taskTitle: "MCP smoke task",
    taskGoal: "Create a task and route it through the new executor model.",
    targetFiles: ["README.md"]
  });
  assert(task.task?.id, "create_task missing task id");
  console.log(`create_task ok: ${task.task.id}`);

  const branch = await callTool(sessionId, "create_task_branch", {
    taskId: task.task.id,
    branchName: "mcp-smoke-branch",
    touchedFiles: ["README.md"]
  });
  assert(branch.taskBranch?.id, "create_task_branch missing branch id");
  console.log(`create_task_branch ok: ${branch.taskBranch.id}`);

  const continued = await callTool(sessionId, "continue_task_branch", {
    taskBranchId: branch.taskBranch.id
  });
  assert(continued.recommendedNextAction, "continue_task_branch should return recommendedNextAction");
  console.log(`continue_task_branch ok: ${continued.recommendedNextAction}`);

  const execution = await callTool(sessionId, "create_execution_job", {
    taskId: task.task.id,
    taskBranchId: branch.taskBranch.id,
    executorMode: "webagent",
    runImmediately: true
  });
  assert(execution.job?.status === "completed", "webagent execution should complete");
  console.log(`create_execution_job ok: ${execution.job.id}`);

  console.log("MCP smoke test passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
