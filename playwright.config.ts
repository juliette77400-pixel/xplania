import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4179);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL ?? (process.platform === "win32" ? "msedge" : undefined);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `vite --host 127.0.0.1 --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          VITE_SUPABASE_PROJECT_ID: process.env.VITE_SUPABASE_PROJECT_ID ?? "test",
          VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? "https://example.supabase.co",
          VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "test-anon-key",
        },
      },
  use: {
    baseURL,
    channel: browserChannel,
    trace: "on-first-retry",
  },
});
