import path from "node:path";

const baseUrl = (process.env.BRIDGE_BASE_URL || `http://127.0.0.1:${process.env.BRIDGE_PORT || 8787}`).replace(/\/$/, "");
const repoRoot = path.resolve(process.cwd(), "..");
const demoProjectPath = path.join(repoRoot, "examples", "demo-project");
let token = process.env.BRIDGE_PAIRING_CODE || process.env.BRIDGE_TOKEN || "";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readBody(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

async function request(method, route, body, auth = true) {
  const headers = { Accept: "application/json" };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { response, body: await readBody(response) };
}

async function must(method, route, body, auth = true) {
  const result = await request(method, route, body, auth);
  assert(result.response.ok, `${method} ${route} failed: ${result.response.status} ${JSON.stringify(result.body)}`);
  return result.body;
}

async function main() {
  if (!token) {
    const bootstrap = await must("GET", "/bootstrap", undefined, false);
    token = bootstrap.token;
  }

  const selected = await must("POST", "/projects/select", { path: demoProjectPath, displayName: "demo-project" });
  const projectId = selected.project.id;

  const indexed = await must("POST", `/projects/${projectId}/index`, { force: true });
  assert(indexed.index.indexedFiles > 0, "Indexing should record at least one file");

  const status = await must("GET", `/projects/${projectId}/index-status`);
  assert(status.index.status === "ready", `Expected ready index status, got ${status.index.status}`);

  const retrieved = await must("POST", `/projects/${projectId}/retrieve-context`, {
    query: "Start workflow",
    purpose: "Smoke test retrieval",
    maxFiles: 4,
    maxSnippets: 6,
    includeRules: true,
    includeSkills: true
  });
  assert(retrieved.retrievedContext.relevantFiles.length > 0, "retrieve_context should return relevant files");
  assert(retrieved.retrievedContext.snippets.length <= 6, "retrieve_context should respect snippet limits");
  assert(retrieved.retrievedContext.snippets.every((item) => item.text.length <= 260), "snippets should stay concise");

  const search = await must("GET", `/projects/${projectId}/search?query=${encodeURIComponent("App")}&limit=3`);
  assert(search.results.length > 0, "search_project should return at least one match");

  console.log("Context index smoke test passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
