// Install only the optional Firefox diagnostic browser into this workspace.
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "../..");
const requested = process.argv.slice(2);
if (requested.length > 1 || (requested[0] && requested[0] !== "firefox")) {
  console.error("Usage: npm run scrape:browser:install -- firefox");
  process.exitCode = 1;
} else {
  try {
    const cli = path.join(path.dirname(require.resolve("playwright-core/package.json")), "cli.js");
    const result = spawnSync(process.execPath, [cli, "install", "firefox"], {
      stdio: "inherit", env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: path.join(root, ".local/playwright-browsers") },
    });
    process.exitCode = result.status ?? 1;
  } catch {
    console.error("Install the optional tool dependencies first; see tools/bet365-browser/README.md.");
    process.exitCode = 1;
  }
}
