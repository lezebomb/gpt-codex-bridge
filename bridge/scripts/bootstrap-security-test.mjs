import http from "node:http";

const baseUrl = new URL((process.env.BRIDGE_BASE_URL || `http://127.0.0.1:${process.env.BRIDGE_PORT || 8787}`).replace(/\/$/, ""));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function requestBootstrap(headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: "127.0.0.1",
      port: Number(baseUrl.port || 80),
      path: "/bootstrap",
      method: "GET",
      headers
    }, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk.toString();
      });
      res.on("end", () => resolve({ statusCode: res.statusCode || 0, body }));
    });
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  const local = await requestBootstrap({ Host: "localhost:8787" });
  assert(local.statusCode === 200, `Expected localhost bootstrap to return 200, got ${local.statusCode}`);

  const publicHost = await requestBootstrap({ Host: "bridge.example.com" });
  assert(publicHost.statusCode === 403, `Expected public host bootstrap to return 403, got ${publicHost.statusCode}`);

  const forwardedPublic = await requestBootstrap({ Host: "localhost:8787", "X-Forwarded-Host": "bridge.example.com" });
  assert(forwardedPublic.statusCode === 403, `Expected forwarded public host bootstrap to return 403, got ${forwardedPublic.statusCode}`);

  console.log("Bootstrap security test passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
