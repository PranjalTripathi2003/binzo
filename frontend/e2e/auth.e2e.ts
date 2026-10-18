import { expect, test } from '@playwright/test';

test('dedicated local test account can authenticate, retain its session, and log out', async ({ page }) => {
  const email = process.env.E2E_AUTH_EMAIL;
  const password = process.env.E2E_AUTH_PASSWORD;
  const apiUrl = process.env.E2E_AUTH_API_URL;
  test.skip(!email || !password || !apiUrl, 'Set E2E_AUTH_API_URL, E2E_AUTH_EMAIL, and E2E_AUTH_PASSWORD for the local auth integration test.');

  await page.goto('/');
  await page.getByRole('button', { name: 'Login / Signup' }).click();
  await page.getByPlaceholder('Email').fill(email!);
  await page.getByPlaceholder('Password').fill(password!);

  const loginResponsePromise = page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith('/auth/login'),
  );
  const profileResponsePromise = page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith('/auth/me'),
  );
  await page.getByRole('button', { name: 'Login', exact: true }).click();

  const loginResponse = await loginResponsePromise;
  expect(loginResponse.status(), 'The backend login endpoint should accept the test credentials.').toBe(200);
  const profileResponse = await profileResponsePromise;
  expect(profileResponse.status(), 'The authenticated profile lookup should succeed after login.').toBe(200);
  await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
  await page.getByRole('button', { name: 'Account' }).click();
  await expect(page.getByRole('menu').getByText(email!)).toBeVisible();
  await page.getByRole('menuitem', { name: 'Log Out' }).click();
  await expect(page.getByRole('button', { name: 'Login / Signup' })).toBeVisible();
});
