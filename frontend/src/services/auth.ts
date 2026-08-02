import { apiFetch } from "./api";

/**
 * Learning task: connect Navbar auth UI to the backend.
 *
 * Files to use with this service:
 * - components/Navbar/Navbar.tsx: collect login/register input and call these functions.
 * - services/api.ts: apiFetch already attaches Authorization when access_token exists.
 *
 * Backend endpoints:
 * - POST /api/auth/register
 * - POST /api/auth/login
 * - GET /api/auth/me
 */

export type AuthUser = {
  id?: string;
  userId?: string;
  email: string;
  name?: string;
  role?: string;
};

export type AuthResponse = {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

/**
 * TODO: Call this from Navbar when the user submits a register form.
 *
 * Steps:
 * 1. Send name/email/password to POST /auth/register.
 * 2. Store result.access_token in localStorage using key "access_token".
 * 3. Store result.refresh_token if you want to build refresh/logout later.
 * 4. Update Navbar UI to show the logged-in user's name/email.
 */
export async function register(input: RegisterInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * TODO: Call this from Navbar when the user submits a login form.
 *
 * Steps:
 * 1. Send email/password to POST /auth/login.
 * 2. Store result.access_token in localStorage using key "access_token".
 * 3. Call getCurrentUser() to confirm the token works.
 * 4. Replace the placeholder "Username" text in Navbar with real user data.
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * TODO: Call this after login/register and when the app first loads.
 *
 * Because apiFetch reads localStorage.access_token, this request should include
 * the Bearer token automatically.
 */
export async function getCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me");
}

/**
 * TODO: Call this from the Navbar logout button.
 *
 * After the backend responds, remove access_token from localStorage and reset
 * the Navbar account UI back to logged-out state.
 */
export async function logout(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/logout", {
    method: "POST",
  });
}
