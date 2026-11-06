// E2E config. Uses the locally installed Chrome/Edge (channel) so no browser
// binaries are downloaded. Override with PW_CHANNEL=msedge|chrome|chromium.
const { defineConfig, devices } = require("@playwright/test");

const PORT = 4173;
module.exports = defineConfig({
  testDir: "tests/e2e",
  timeout: 30000,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "data/reports/e2e-results.json" }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}/`,
    channel: process.env.PW_CHANNEL || "chrome",
    trace: "off",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    { name: "mobile", use: { ...devices["Pixel 5"], channel: process.env.PW_CHANNEL || "chrome" } },
  ],
  webServer: { command: "node scripts/serve.mjs", port: PORT, reuseExistingServer: true, timeout: 20000 },
});
