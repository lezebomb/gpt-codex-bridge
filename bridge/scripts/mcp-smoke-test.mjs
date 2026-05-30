const baseUrl = (process.env.BRIDGE_BASE_URL || `http://localhost:${process.env.BRIDGE_PORT || 8787}`).replace(/\/$/, "");
let token = process.env.BRIDGE_PAIRING_CODE || process.env.BRIDGE_TOKEN || "";
let rpcId = 1;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function jsonOrText(response) {
  const text = await response.text();
  if (!text) return {};
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/event-stream")) {
    const dataLine = text.split("\n").map((line) => line.trim()).find((line) => line.startsWith("data:"));
    return dataLine ? JSON.parse(dataLine.slice(5).trim()) : {};
  }
  try {
    return JSON.parse(text);
  } catch {
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
      clientInfo: { name: "bridge-mcp-smoke", version: "1.0.0" }
    }
  });
  const sessionId = init.sessionId;
  assert(sessionId, "initialize did not return mcp-session-id");
  console.log(`initialized session: ${sessionId}`);

  await mcpPost({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }, sessionId);

  const toolsResponse = await mcpPost({ jsonrpc: "2.0", id: rpcId++, method: "tools/list", params: {} }, sessionId);
  const tools = toolsResponse.body.result?.tools || [];
  assert(tools.length >= 16, `expected at least 16 tools, got ${tools.length}`);
  assert(tools.some((tool) => tool.name === "get_bridge_status"), "get_bridge_status missing");
  console.log(`tools/list ok: ${tools.length} tools`);

  const status = await callTool(sessionId, "get_bridge_status");
  assert(status.bridgeVersion, "get_bridge_status missing bridgeVersion");
  console.log(`status ok: execution=${status.executionMode}; permission=${status.permissionMode}`);

  const projects = await callTool(sessionId, "list_projects");
  assert(Array.isArray(projects.projects), "list_projects did not return projects array");
  console.log(`list_projects ok: ${projects.projects.length} projects`);

  const folders = await callTool(sessionId, "browse_folders");
  assert(Array.isArray(folders.roots), "browse_folders did not return roots");
  console.log(`browse_folders ok: ${folders.roots.length} roots`);

  console.log("MCP smoke test passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
