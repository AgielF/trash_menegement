import { defineConfig, devices } from '@playwright/test'

// E2E hanya alur kritis: login, mulai ambil, catat, bayar, skip, offline lalu sinkron.
// Jalur dasar mengarah ke dev server lokal; perluas saat bertahap menuju staging.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: process.env.CI !== undefined,
  retries: process.env.CI !== undefined ? 2 : 0,
  reporter: process.env.CI !== undefined ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    viewport: { width: 360, height: 780 }, // mobile-first: viewport kecil dulu
  },
  projects: [{ name: 'chromium', use: { ...devices['Pixel 8'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: process.env.CI === undefined,
  },
})
