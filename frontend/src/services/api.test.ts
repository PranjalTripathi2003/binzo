import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL, apiFetch, refreshAccessToken } from './api';

const jsonResponse = (status: number, body: unknown) => ({
  status,
  ok: status >= 200 && status < 300,
  json: vi.fn().mockResolvedValue(body),
});

describe('apiFetch', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('adds the bearer token, parses the response envelope, and returns its data', async () => {
    localStorage.setItem('access_token', 'access-token');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {
      success: true, data: [{ id: 'p1' }],
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch('/products')).resolves.toEqual([{ id: 'p1' }]);
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/products`, expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
    }));
  });

  it('throws the server message for an unsuccessful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(400, {
      success: false, data: null, message: 'Invalid request',
    })));
    await expect(apiFetch('/products')).rejects.toThrow('Invalid request');
  });

  it('refreshes an expired session and retries with the replacement token', async () => {
    localStorage.setItem('access_token', 'expired-token');
    localStorage.setItem('refresh_token', 'refresh-token');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(401, { success: false, data: null }))
      .mockResolvedValueOnce(jsonResponse(200, {
        success: true, data: { access_token: 'new-access', refresh_token: 'new-refresh' },
      }))
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: { id: 'me' } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch('/auth/me')).resolves.toEqual({ id: 'me' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][1]).toEqual(expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer new-access' }),
    }));
    expect(localStorage.getItem('refresh_token')).toBe('new-refresh');
  });

  it('clears stored credentials and rejects when an unauthorized request cannot refresh', async () => {
    localStorage.setItem('access_token', 'expired-token');
    localStorage.setItem('refresh_token', 'invalid-refresh');
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse(401, { success: false, data: null }))
      .mockResolvedValueOnce(jsonResponse(401, { success: false, data: null })));

    await expect(apiFetch('/orders')).rejects.toThrow('unauthenticated');
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('returns null when no refresh token exists', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(refreshAccessToken()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
