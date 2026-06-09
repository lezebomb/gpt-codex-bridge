import { BridgeService } from "../dist/bridge-service.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  const service = new BridgeService();
  const run = service.beginToolRun("get_bridge_status", {}, "events-test");
  service.completeToolRun(run.id, { ok: true });
  const loaded = service.getRun(run.id);
  assert(loaded.run.id === run.id, "get_run should return the created run");
  assert(loaded.events.some((event) => event.type === "run.created"), "run.created event missing");
  assert(loaded.events.some((event) => event.type === "tool.called"), "tool.called event missing");
  assert(loaded.events.some((event) => event.type === "tool.completed"), "tool.completed event missing");
  console.log("Events test passed.");
}

main();

