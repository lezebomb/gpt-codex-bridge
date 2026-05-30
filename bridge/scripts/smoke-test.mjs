const baseUrl = (process.env.BRIDGE_BASE_URL || `http://localhost:${process.env.BRIDGE_PORT || 8787}`).replace(/\/$/, "");
let token = process.env.BRIDGE_TOKEN || "";

async function request(path, tokenOverride = token) {
  const headers = {};
  if (tokenOverride) headers.Authorization = `Bearer ${tokenOverride}`;
  const response = await fetch(`${baseUrl}${path}`, { headers });
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }
  return { response, body };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  console.log(`Smoke target: ${baseUrl}`);

  const health = await request("/health", "");
  assert(health.response.ok, `/health failed: ${health.response.status}`);
  assert(health.body?.ok === true, "/health did not return ok=true");
  console.log(`health ok: execution=${health.body.execution}; permission=${health.body.permissionMode}`);

  if (!token) {
    const bootstrap = await request("/bootstrap", "");
    assert(bootstrap.response.ok, `/bootstrap failed: ${bootstrap.response.status}`);
    assert(Boolean(bootstrap.body?.token), "/bootstrap missing token");
    token = bootstrap.body.token;
    console.log(`bootstrap ok: execution=${bootstrap.body.execution}; token=${bootstrap.body.tokenPreview || "loaded"}`);
  }

  const wrongToken = await request("/config", "wrong-token");
  assert(wrongToken.response.status === 401, `/config with wrong token should be 401, got ${wrongToken.response.status}`);
  assert(Boolean(wrongToken.body?.requestId), "401 response should include requestId");
  console.log(`wrong token rejected with requestId=${wrongToken.body.requestId}`);

  const config = await request("/config", token);
  assert(config.response.ok, `/config failed with correct token: ${config.response.status}`);
  assert(Boolean(config.body?.settings?.permissionMode), "/config missing settings.permissionMode");
  console.log(`config ok: execution=${config.body.execution}; permission=${config.body.settings.permissionMode}`);

  console.log("Smoke test passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
