const API_BASE_URL = "http://localhost:3000/api";

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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

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
