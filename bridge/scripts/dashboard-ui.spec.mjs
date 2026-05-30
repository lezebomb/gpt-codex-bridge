import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.BRIDGE_BASE_URL || "http://localhost:8787";
const repoRoot = path.resolve(process.cwd(), "..");
const demoProjectPath = path.join(repoRoot, "examples", "demo-project");
const demoReadmePath = path.join(demoProjectPath, "README.md");

test("dashboard setup, project, patch, job, logs, and MCP center", async ({ page }) => {
  test.setTimeout(150000);
  const originalReadme = fs.readFileSync(demoReadmePath, "utf8");
  const marker = `Dashboard UI smoke marker ${Date.now()}`;
  const patchedReadme = `${originalReadme.trimEnd()}\n\n${marker}\n`;
  const patchTitle = `UI smoke patch ${Date.now()}`;
  const jobTitle = `UI smoke dry-run job ${Date.now()}`;

  fs.mkdirSync(path.join(process.cwd(), "output", "playwright"), { recursive: true });

  await page.goto(`${baseUrl}/dashboard/`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.getByRole("heading", { name: "连接向导" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("unauthorized");
  await expect(page.locator("body")).toContainText("本地配对码");

  await page.getByRole("button", { name: "测试连接" }).click();
  await expect(page.locator(".alert.success")).toContainText("连接成功");
  await expect(page.locator("body")).not.toContainText("认证失败");

  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Setup" })).toBeVisible();
  await page.getByRole("button", { name: "中文" }).click();
  await expect(page.getByRole("heading", { name: "连接向导" })).toBeVisible();

  await page.locator('[data-action="toggle-sidebar"]').first().click();
  await expect(page.locator(".shell")).toHaveClass(/collapsed/);
  await page.locator(".topbar [data-action='toggle-sidebar']").click();
  await expect(page.locator(".shell")).not.toHaveClass(/collapsed/);

  const selectStyle = await page.locator("#projectSelect").evaluate((el) => {
    const style = getComputedStyle(el);
    return { color: style.color, backgroundColor: style.backgroundColor };
  });
  expect(selectStyle.backgroundColor).not.toBe("rgb(128, 128, 128)");
  expect(selectStyle.color).not.toBe("rgb(255, 255, 255)");

  await page.locator('[data-view="project"]').click();
  await expect(page.getByRole("heading", { name: "项目", exact: true })).toBeVisible();
  await page.locator('#manualProjectForm input[name="displayName"]').fill("demo-project");
  await page.locator('#manualProjectForm input[name="path"]').fill(demoProjectPath);
  await page.locator('#manualProjectForm button[type="submit"]').click();
  await expect(page.locator(".alert.success")).toContainText("项目已注册");
  await expect(page.locator("#projectSelect")).toContainText("demo-project");

  await page.locator('#fileReadForm input[name="filePath"]').fill("src/App.tsx");
  await page.locator('#fileReadForm [data-action="read-file"]').click();
  await expect(page.locator("#fileContentArea")).toHaveValue(/App/);

  await page.locator('[data-view="tasks"]').click();
  await page.locator('#patchForm input[name="title"]').fill(patchTitle);
  await page.locator('#patchForm input[name="filePath"]').fill("README.md");
  await page.locator('#patchForm select[name="mode"]').selectOption("overwrite");
  await page.locator('#patchForm textarea[name="rationale"]').fill("Playwright dashboard smoke test.");
  await page.locator('#patchForm textarea[name="content"]').fill(patchedReadme);
  await page.locator('#patchForm button[type="submit"]').click();
  await expect(page.locator(".item", { hasText: patchTitle }).first()).toBeVisible();

  const patchItem = page.locator(".item", { hasText: patchTitle }).first();
  await patchItem.locator("[data-patch-diff]").click();
  await expect(page.locator("pre", { hasText: marker }).first()).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await patchItem.locator("[data-patch-apply]").click();
  await expect.poll(() => fs.readFileSync(demoReadmePath, "utf8")).toContain(marker);

  const appliedPatchItem = page.locator(".item", { hasText: patchTitle }).first();
  page.once("dialog", (dialog) => dialog.accept());
  await appliedPatchItem.locator("[data-patch-revert]").click();
  await expect.poll(() => fs.readFileSync(demoReadmePath, "utf8")).toBe(originalReadme);

  await page.locator('#jobForm input[name="title"]').fill(jobTitle);
  await page.locator('#jobForm input[name="roles"]').fill("qa_reviewer");
  await page.locator('#jobForm select[name="safetyLevel"]').selectOption("1");
  await page.locator('#jobForm textarea[name="task"]').fill("Dry-run verification from Playwright UI smoke test.");
  await page.locator('#jobForm button[type="submit"]').click();
  await expect(page.locator(".item", { hasText: jobTitle }).first()).toBeVisible();
  await page.locator(".item", { hasText: jobTitle }).first().locator("[data-job-approve]").click();
  await expect(page.locator(".item", { hasText: jobTitle }).first()).toContainText(/completed|已完成/);

  await page.locator('[data-view="logs"]').click();
  await page.locator('[data-action="load-logs"]').click();
  await expect(page.locator(".item").first()).toBeVisible();

  await page.locator('[data-view="mcp"]').click();
  await page.locator('[data-action="load-mcp-tools"]').click();
  await expect(page.locator(".item", { hasText: "get_bridge_status" }).first()).toBeVisible();

  await page.screenshot({ path: "output/playwright/dashboard-smoke.png", fullPage: true });
});
