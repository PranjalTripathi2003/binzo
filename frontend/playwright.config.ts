import { defineConfig, devices } from '@playwright/test';

const authApiBaseUrl = process.env.E2E_AUTH_API_URL ?? 'http://127.0.0.1:3000/api';

if (process.env.E2E_AUTH_API_URL) {
  const authApiHost = new URL(process.env.E2E_AUTH_API_URL).hostname;
  if (!['localhost', '127.0.0.1', '::1'].includes(authApiHost)) {
    throw new Error('E2E_AUTH_API_URL must point to a local test backend. Production and remote hosts are blocked.');
  }
}

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    // Match backend/src/main.ts CORS allowlist for local frontend requests.
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --strictPort',
    env: { VITE_API_BASE_URL: authApiBaseUrl },
    url: 'http://localhost:5173',
    // The opt-in auth test needs a fresh Vite process with its test API URL.
    reuseExistingServer: !process.env.CI && !process.env.E2E_AUTH_API_URL,
    timeout: 30_000,
  },
});
