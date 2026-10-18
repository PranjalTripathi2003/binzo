# Browser end-to-end tests

Run the browser suite from `frontend/`:

```sh
npm run test:e2e
```

The storefront tests use mocked API responses. The checkout scenario uses a payment test double and does not contact Razorpay or charge a card.

## Optional real authentication test

`auth.e2e.ts` submits credentials to a dedicated local backend. It is skipped unless all three variables below are set. The Playwright config rejects non-local API hosts to prevent using production credentials by mistake.

Start the backend connected to a local/test Supabase project, create a disposable test account, then set the variables in PowerShell and run the suite. The auth test starts a fresh Vite server with the supplied API URL; stop any other frontend dev server already using port `5173` first.

```powershell
$env:E2E_AUTH_API_URL = "http://127.0.0.1:3000/api"
$env:E2E_AUTH_EMAIL = "your-disposable-test-account@example.test"
$env:E2E_AUTH_PASSWORD = "your-disposable-test-password"
npm run test:e2e
```

The test verifies successful login, session restoration after reload, and logout. Keep the credentials in your shell environment; do not commit them or use a production account.
