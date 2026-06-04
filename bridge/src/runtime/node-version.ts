import { MIN_NODE_MAJOR } from "../config.js";

export function parseNodeMajor(version: string): number {
  const match = String(version || "").trim().match(/^v?(\d+)/);
  return match ? Number(match[1]) : 0;
}

export function isSupportedNodeVersion(version: string, minMajor = MIN_NODE_MAJOR): boolean {
  return parseNodeMajor(version) >= minMajor;
}

export function assertSupportedNodeVersion(version = process.version, minMajor = MIN_NODE_MAJOR): void {
  if (isSupportedNodeVersion(version, minMajor)) {
    return;
  }
  throw new Error(`当前 Node 版本过低（${version}）。请安装 Node.js 最新稳定版后重试，最低要求为 Node >= ${minMajor}。`);
}
