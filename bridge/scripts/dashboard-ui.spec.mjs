import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.BRIDGE_BASE_URL || "http://localhost:8787";
const repoRoot = path.resolve(process.cwd(), "..");
const demoProjectPath = path.join(repoRoot, "examples", "demo-project");
const demoReadmePath = path.join(demoProjectPath, "README.md");

test("dashboard connection, core workflow, and repair flow", async ({ page }) => {
  test.setTimeout(120000);
  const marker = `Dashboard smoke marker ${Date.now()}`;
  const patchTitle = `Smoke patch ${Date.now()}`;
  const jobTitle = `Smoke dry-run job ${Date.now()}`;
  const originalReadme = fs.readFileSync(demoReadmePath, "utf8");
  const patchedReadme = `${originalReadme.trimEnd()}\n\n${marker}\n`;
  fs.mkdirSync(path.join(process.cwd(), "output", "playwright"), { recursive: true });
  const bootstrapResponse = await page.request.get(`${baseUrl}/bootstrap`);
  expect(bootstrapResponse.ok()).toBeTruthy();
  const bootstrap = await bootstrapResponse.json();
  const token = process.env.BRIDGE_TOKEN || bootstrap.token;
  expect(token).toBeTruthy();

  await page.goto(`${baseUrl}/dashboard/`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.locator("#topConnectionText")).toContainText("已连接");
  await expect(page.locator("#alert")).not.toContainText("unauthorized");

  await page.locator('[data-view="settings"]').click();
  await expect(page.locator('#settingsForm [name="baseUrl"]')).toHaveValue(baseUrl);
  await expect(page.locator('#settingsForm [name="baseUrl"]')).not.toBeEditable();
  await expect(page.locator('#settingsForm [name="token"]')).not.toBeEditable();
  await page.evaluate(() => localStorage.setItem("ccb_token", "wrong-token"));
  await page.reload();
  await page.locator('[data-view="settings"]').click();
  await page.locator("#testConnection").click();
  await expect(page.locator("#alert")).toContainText("认证失败");

  await page.evaluate((nextToken) => localStorage.setItem("ccb_token", nextToken), token);
  await page.reload();
  await page.locator('[data-view="settings"]').click();
  await page.locator("#testConnection").click();
  await expect(page.locator("#settingsStatus")).toContainText("连接成功");
  await expect(page.locator("#alert")).not.toContainText("unauthorized");
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator("#regenerateToken").click();
  await expect(page.locator("#alert")).toContainText("本机访问令牌已重新生成");

  await page.locator('[data-lang="en"]').click();
  await expect(page.locator("h1")).toContainText("Local Workflow Console");
  await page.locator('[data-lang="zh"]').click();
  await expect(page.locator("h1")).toContainText("本地工作流控制台");

  await page.locator("#sidebarToggle").click();
  await expect(page.locator("#appShell")).toHaveClass(/sidebar-collapsed/);
  await page.locator("#sidebarToggle").click();
  await expect(page.locator("#appShell")).not.toHaveClass(/sidebar-collapsed/);

  const selectStyle = await page.locator("#projectSelect").evaluate((el) => {
    const style = getComputedStyle(el);
    return { color: style.color, backgroundColor: style.backgroundColor };
  });
  expect(selectStyle.color).not.toBe("rgb(255, 255, 255)");
  expect(selectStyle.backgroundColor).not.toBe("rgb(128, 128, 128)");

  await page.locator('[data-view="projects"]').click();
  await page.locator('#projectForm [name="name"]').fill("demo-project");
  await page.locator('#projectForm [name="path"]').fill(demoProjectPath);
  await page.locator('#projectForm button[type="submit"]').click();
  await expect(page.locator("#projectSelect")).toContainText("demo-project");

  await page.locator('[data-view="files"]').click();
  await page.locator('#fileReadForm [name="filePath"]').fill("src/App.tsx");
  await page.locator('#fileReadForm button[type="submit"]').click();
  await expect(page.locator("#fileTreeDetail")).toContainText("App.tsx");

  await page.locator('[data-view="patches"]').click();
  await page.locator('#patchForm [name="title"]').fill(patchTitle);
  await page.locator('#patchForm [name="rationale"]').fill("Playwright smoke test patch.");
  await page.locator('#patchForm [name="filePath"]').fill("README.md");
  await page.locator('#patchForm [name="mode"]').selectOption("overwrite");
  await page.locator('#patchForm [name="content"]').fill(patchedReadme);
  await page.locator('#patchForm button[type="submit"]').click();
  await expect(page.locator("#patchList")).toContainText(patchTitle);

  const patchItem = page.locator(".item", { hasText: patchTitle }).first();
  await patchItem.locator('[data-action="diff-patch"]').click();
  await expect(page.locator("#diffDetail")).toContainText(marker);

  await page.locator('[data-view="patches"]').click();
  page.once("dialog", (dialog) => dialog.accept());
  await patchItem.locator('[data-action="apply-patch"]').click();
  await expect(page.locator("#patchList")).toContainText("已应用");

  const appliedItem = page.locator(".item", { hasText: patchTitle }).first();
  page.once("dialog", (dialog) => dialog.accept());
  await appliedItem.locator('[data-action="revert-patch"]').click();
  await expect(page.locator(".item", { hasText: patchTitle }).first()).toContainText("已回滚");
  await expect.poll(() => fs.readFileSync(demoReadmePath, "utf8")).toBe(originalReadme);

  await page.locator('[data-view="jobs"]').click();
  await page.locator('#jobForm [name="title"]').fill(jobTitle);
  await page.locator('#jobForm [name="roles"]').fill("qa_reviewer");
  await page.locator('#jobForm [name="safetyLevel"]').selectOption("1");
  await page.locator('#jobForm [name="task"]').fill("Dry-run verification from Playwright UI smoke test.");
  await page.locator('#jobForm button[type="submit"]').click();
  await expect(page.locator("#jobList")).toContainText(jobTitle);

  await page.locator('#jobList [data-action="approve-run-job"]').first().click();
  await expect(page.locator("#jobList")).toContainText("已完成");

  await page.locator('[data-view="logs"]').click();
  await page.locator("#refreshLogs").click();
  await expect(page.locator("#logList")).toContainText(/web_patch|codex|http/);

  await page.locator('[data-view="files"]').click();
  await page.locator('#fileReadForm [name="filePath"]').fill("src/does-not-exist.tsx");
  await page.locator('#fileReadForm button[type="submit"]').click();
  await expect(page.locator("#alert")).toContainText("请求编号");

  await page.locator('[data-view="repairs"]').click();
  await page.locator("#loadLatestErrors").click();
  await expect(page.locator("#repairSourceDetail")).toContainText("请求编号");
  await page.locator("#fillRepairFromLatest").click();
  await expect(page.locator('#repairForm [name="errorSummary"]')).not.toHaveValue("");

  await page.screenshot({ path: "output/playwright/dashboard-smoke.png", fullPage: true });
});
