import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './api';
import { getCurrentUser, login, logout, register } from './auth';

vi.mock('./api', () => ({ apiFetch: vi.fn() }));

const apiFetchMock = vi.mocked(apiFetch);

describe('auth service', () => {
  beforeEach(() => apiFetchMock.mockReset());

  it('submits login and registration payloads to their auth endpoints', async () => {
    apiFetchMock.mockResolvedValue({ user: null, access_token: 'a', refresh_token: 'r' });
    const loginPayload = { email: 'user@example.com', password: 'secret' };
    const registerPayload = { ...loginPayload, name: 'User', phone: '1234567890' };

    await login(loginPayload);
    await register(registerPayload);

    expect(apiFetchMock).toHaveBeenNthCalledWith(1, '/auth/login', {
      method: 'POST', body: JSON.stringify(loginPayload),
    });
    expect(apiFetchMock).toHaveBeenNthCalledWith(2, '/auth/register', {
      method: 'POST', body: JSON.stringify(registerPayload),
    });
  });

  it('loads the current user and calls the logout endpoint', async () => {
    apiFetchMock.mockResolvedValueOnce({ email: 'user@example.com' })
      .mockResolvedValueOnce({ message: 'Signed out' });

    await expect(getCurrentUser()).resolves.toEqual({ email: 'user@example.com' });
    await expect(logout()).resolves.toEqual({ message: 'Signed out' });
    expect(apiFetchMock).toHaveBeenNthCalledWith(1, '/auth/me');
    expect(apiFetchMock).toHaveBeenNthCalledWith(2, '/auth/logout', { method: 'POST' });
  });
});
