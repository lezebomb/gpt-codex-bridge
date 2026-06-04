import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.BRIDGE_BASE_URL || "http://localhost:8787";
const repoRoot = path.resolve(process.cwd(), "..");
const demoProjectPath = path.join(repoRoot, "examples", "demo-project");
const demoReadmePath = path.join(demoProjectPath, "README.md");

test("dashboard setup, project, tasks, approvals, logs, mcp center, and executors", async ({ page }) => {
  test.setTimeout(150000);
  const runId = Date.now();
  const originalReadme = fs.readFileSync(demoReadmePath, "utf8");
  const marker = `Dashboard UI smoke marker ${runId}`;
  const taskTitle = `UI smoke task ${runId}`;
  const patchTitle = `UI smoke patch ${runId}`;
  const patchedReadme = `${originalReadme.trimEnd()}\n\n${marker}\n`;

  fs.mkdirSync(path.join(process.cwd(), "output", "playwright"), { recursive: true });

  try {
    await page.goto(`${baseUrl}/dashboard/`);
    await expect(page.getByRole("heading", { name: "ChatGPT Web-first Bridge" })).toBeVisible();
    await expect(page.locator("body")).toContainText("主界面是 ChatGPT 网页端");

    await page.locator("[data-action='test-connection']").click();
    await expect(page.locator(".alert.success")).toBeVisible();

    await page.locator("[data-action='switch-language']").click();
    await expect(page.locator("body")).toContainText("Your main workspace is ChatGPT Web");
    await page.locator("[data-action='switch-language']").click();

    await page.locator("[data-action='toggle-sidebar']").first().click();
    await expect(page.locator(".shell")).toHaveClass(/collapsed/);
    await page.locator("[data-action='toggle-sidebar']").first().click();
    await expect(page.locator(".shell")).not.toHaveClass(/collapsed/);

    await page.locator("[data-view='project']").click();
    await page.locator(".browser-item", { hasText: "Repository" }).first().locator("[data-open-path]").click();
    await page.locator(".browser-item", { hasText: "examples" }).first().locator("[data-open-path]").click();
    await page.locator(".browser-item", { hasText: "demo-project" }).first().locator("[data-register-path]").click();
    await expect.poll(async () => (await page.locator("#projectSelect option").allTextContents()).some((text) => text.includes("demo-project"))).toBeTruthy();
    await page.locator("#projectSelect").selectOption({ label: "demo-project" });
    await page.locator("[data-action='inspect-project']").click();
    await expect(page.locator("body")).toContainText("demo-project");

    await page.locator("#readFileForm input[name='path']").fill("src/App.tsx");
    await page.locator("#readFileForm button[type='submit']").click();
    await expect(page.locator("#fileContentPre")).toContainText("App");

    await page.locator("[data-view='tasks']").click();
    await page.locator("#taskForm input[name='taskTitle']").fill(taskTitle);
    await page.locator("#taskForm textarea[name='taskGoal']").fill("Create a task through the new dashboard task flow.");
    await page.locator("#taskForm input[name='targetFiles']").fill("README.md");
    await page.locator("#taskForm button[type='submit']").click();
    await expect(page.locator(".item", { hasText: taskTitle }).first()).toBeVisible();

    await page.locator("#patchForm input[name='title']").fill(patchTitle);
    await page.locator("#patchForm input[name='filePath']").fill("README.md");
    await page.locator("#patchForm textarea[name='rationale']").fill("Playwright smoke test patch.");
    await page.locator("#patchForm textarea[name='content']").fill(patchedReadme);
    await page.locator("#patchForm button[type='submit']").click();
    await expect(page.locator(".item", { hasText: patchTitle }).first()).toBeVisible();

    await page.locator(".item", { hasText: patchTitle }).first().locator("[data-patch-diff]").click();
    await expect(page.locator("#taskDetailPre")).toContainText(marker);

    await page.locator("[data-view='approvals']").click();
    await page.locator(".item", { hasText: patchTitle }).first().locator("[data-apply-patch]").click();
    await expect.poll(() => fs.readFileSync(demoReadmePath, "utf8")).toContain(marker);

    await page.locator("[data-view='tasks']").click();
    await page.locator(".item", { hasText: taskTitle }).first().locator("[data-create-job]").click();
    await expect(page.locator(".item", { hasText: taskTitle }).first()).toBeVisible();

    await page.locator("[data-view='logs']").click();
    await page.locator("[data-action='load-logs']").click();
    await expect(page.locator(".item").first()).toBeVisible();

    await page.locator("[data-view='mcp']").click();
    await expect(page.locator(".item", { hasText: "get_bridge_status" }).first()).toBeVisible();

    await page.locator("[data-view='executors']").click();
    await expect(page.locator("body")).toContainText("webagent");

    await page.screenshot({ path: "output/playwright/dashboard-smoke.png", fullPage: true });
  } finally {
    if (fs.existsSync(demoReadmePath) && fs.readFileSync(demoReadmePath, "utf8") !== originalReadme) {
      fs.writeFileSync(demoReadmePath, originalReadme, "utf8");
    }
  }
});
