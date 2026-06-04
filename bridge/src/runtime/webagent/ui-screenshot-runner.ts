import path from "node:path";

import { chromium } from "@playwright/test";

import { SCREENSHOTS_DIR } from "../../config.js";
import { ensureDir, now } from "../../lib/common.js";
import { ExecutionJob, Project, TaskArtifact, TaskRecord } from "../../types.js";
import { LogStore } from "../log-store.js";

export class UiScreenshotRunner {
  constructor(private readonly logStore: LogStore) {
    ensureDir(SCREENSHOTS_DIR);
  }

  private screenshotTarget(task: TaskRecord): { finalUrl?: string; notes?: string; error?: string } {
    const request = task.uiScreenshotRequest;
    if (!request?.devServerUrl) {
      return {
        notes: request?.notes,
        error: "No devServerUrl was provided. Start the local dev server and pass devServerUrl, for example http://127.0.0.1:3000."
      };
    }
    try {
      const finalUrl = new URL(request.route || "/", request.devServerUrl).toString();
      return { finalUrl, notes: request.notes };
    } catch {
      return {
        notes: request?.notes,
        error: `The devServerUrl or route is invalid. Received devServerUrl=${request.devServerUrl} route=${request.route || "/"}`
      };
    }
  }

  async run(job: ExecutionJob, task: TaskRecord, project: Project, requestId?: string): Promise<Partial<ExecutionJob>> {
    const target = this.screenshotTarget(task);
    if (!target.finalUrl) {
      this.logStore.write({
        level: "warn",
        source: "playwright",
        action: "create_ui_screenshot_job",
        message: "UI screenshot request is missing a usable target URL.",
        requestId,
        projectId: project.id,
        taskId: task.id,
        details: { jobId: job.id, error: target.error }
      });
      return {
        status: "failed",
        exitCode: 1,
        error: target.error,
        stdout: "",
        stderr: target.error,
        result: [
          "UI screenshot job could not start.",
          target.error,
          "Start the local dev server, then retry create_ui_screenshot_job with devServerUrl and an optional route."
        ].join("\n")
      };
    }

    const screenshotPath = path.join(SCREENSHOTS_DIR, `${job.id}.png`);
    const capturedAt = now();
    let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;

    try {
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(target.finalUrl, { waitUntil: "networkidle", timeout: 15000 });
      await page.screenshot({ path: screenshotPath, fullPage: true });
      const title = await page.title();
      const bodySnippet = ((await page.locator("body").innerText().catch(() => "")) || "").replace(/\s+/g, " ").slice(0, 500);
      const artifact: TaskArtifact = {
        id: `${job.id}-screenshot`,
        type: "screenshot",
        label: `Screenshot ${path.basename(screenshotPath)}`,
        meta: {
          screenshotPath,
          finalUrl: target.finalUrl,
          capturedAt,
          title
        }
      };
      const result = [
        "UI screenshot captured successfully.",
        `URL: ${target.finalUrl}`,
        `Saved to: ${screenshotPath}`,
        title ? `Title: ${title}` : "",
        bodySnippet ? `Snippet: ${bodySnippet}` : "",
        target.notes ? `Notes: ${target.notes}` : ""
      ].filter(Boolean).join("\n");
      this.logStore.write({
        level: "info",
        source: "playwright",
        action: "create_ui_screenshot_job",
        message: "UI screenshot captured.",
        requestId,
        projectId: project.id,
        taskId: task.id,
        details: { jobId: job.id, screenshotPath, finalUrl: target.finalUrl }
      });
      return {
        status: "completed",
        exitCode: 0,
        stdout: JSON.stringify({ screenshotPath, finalUrl: target.finalUrl, title, bodySnippet, capturedAt }, null, 2),
        stderr: "",
        result,
        artifacts: [artifact]
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const nextStep = message.includes("spawn EPERM") || message.includes("browserType.launch")
        ? "This environment blocked Playwright from launching Chromium. Re-run the bridge or screenshot job in a terminal/session that allows local browser launch, then retry create_ui_screenshot_job."
        : "Make sure the local dev server is running and the route is reachable, then retry create_ui_screenshot_job.";
      const guidance = [
        "UI screenshot capture failed.",
        `Target URL: ${target.finalUrl}`,
        message,
        nextStep
      ].join("\n");
      this.logStore.write({
        level: "error",
        source: "playwright",
        action: "create_ui_screenshot_job",
        message: "UI screenshot capture failed.",
        requestId,
        projectId: project.id,
        taskId: task.id,
        details: { jobId: job.id, finalUrl: target.finalUrl, error: message }
      });
      return {
        status: "failed",
        exitCode: 1,
        error: message,
        stdout: "",
        stderr: message,
        result: guidance
      };
    } finally {
      await browser?.close();
    }
  }
}
