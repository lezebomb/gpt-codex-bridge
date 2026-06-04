import { assertSupportedNodeVersion, isSupportedNodeVersion } from "../dist/runtime/node-version.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  assert(isSupportedNodeVersion(process.version), `Current runtime should satisfy the declared Node floor: ${process.version}`);
  assert(!isSupportedNodeVersion("v22.0.0"), "Node 22 should be rejected by the version guard");
  assertSupportedNodeVersion(process.version);
  console.log("Node version smoke test passed.");
}

main();
