import { DEFAULT_EXECUTION, RUNTIME_FILE } from "../config.js";
import { generateLocalToken, readJsonFile, writeJsonFile } from "../lib/common.js";
import { RuntimeSettings, executionModeSchema } from "../types.js";

export class RuntimeStore {
  private normalize(input: unknown): RuntimeSettings {
    const value = input && typeof input === "object" ? (input as Partial<RuntimeSettings>) : {};
    const token = String(value.token || process.env.BRIDGE_TOKEN || generateLocalToken()).trim();
    return {
      token: token || generateLocalToken(),
      execution: executionModeSchema.catch(DEFAULT_EXECUTION).parse(value.execution || DEFAULT_EXECUTION),
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString()
    };
  }

  load(): RuntimeSettings {
    const runtime = this.normalize(readJsonFile(RUNTIME_FILE, {}));
    writeJsonFile(RUNTIME_FILE, runtime);
    return runtime;
  }

  save(partial: Partial<RuntimeSettings>): RuntimeSettings {
    const current = this.load();
    const runtime = this.normalize({
      ...current,
      ...partial,
      updatedAt: new Date().toISOString()
    });
    writeJsonFile(RUNTIME_FILE, runtime);
    return runtime;
  }
}
