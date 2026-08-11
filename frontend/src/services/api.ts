export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
};

/**
 * Base fetch wrapper for communicating with the NestJS backend API.
 * Automatically injects the JWT Bearer token from localStorage if present.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("access_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle unauthorized (expired access token)
  if (response.status === 401 && endpoint !== "/auth/refresh") {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshJson: ApiResponse<{ access_token: string; refresh_token: string }> =
            await refreshResponse.json();

          if (refreshJson.success && refreshJson.data) {
            const { access_token, refresh_token } = refreshJson.data;
            localStorage.setItem("access_token", access_token);
            localStorage.setItem("refresh_token", refresh_token);

            // Retry the original request with the fresh token
            headers.Authorization = `Bearer ${access_token}`;
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
              ...options,
              headers,
            });
          }
        }
      } catch (err) {
        console.error("Transparent token refresh failed:", err);
      }
    }
  }

  if (response.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    throw new Error("unauthenticated");
  }

  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(
      json.message || "An error occurred while communicating with the server.",
    );
  }

  return json.data;
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");

  if (!refreshToken) {
    return null;
  }

  try {
    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!refreshResponse.ok) {
      return null;
    }

    const refreshJson: ApiResponse<{
      access_token: string;
      refresh_token: string;
    }> = await refreshResponse.json();

    if (!refreshJson.success || !refreshJson.data) {
      return null;
    }

    const { access_token, refresh_token } = refreshJson.data;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);

    return access_token;
  } catch (err) {
    console.error("Transparent token refresh failed:", err);
    return null;
  }
}
