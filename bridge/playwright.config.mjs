export default {
  testDir: "./scripts",
  testMatch: "dashboard-ui.spec.mjs",
  outputDir: "./test-results",
  reporter: "list",
  use: {
    browserName: "chromium",
    headless: true
  }
};
