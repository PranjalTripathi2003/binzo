import { apiFetch } from "./api";
import { supabasePublishableKey, supabaseUrl } from "../config/supabase";

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
  user: AuthUser | null;
  access_token: string | null;
  refresh_token: string | null;
};

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
  phone?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

/** Starts a PKCE Google OAuth flow through Supabase Auth. */
export async function signInWithGoogle(): Promise<void> {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Google sign-in is not configured for this frontend.');
  }

  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = toBase64Url(randomBytes);
  const challengeBytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  );
  const challenge = toBase64Url(new Uint8Array(challengeBytes));
  const redirectTo = `${window.location.origin}/auth/callback`;

  sessionStorage.setItem('supabase_oauth_code_verifier', verifier);

  const authorizeUrl = new URL(`${supabaseUrl}/auth/v1/authorize`);
  authorizeUrl.searchParams.set('provider', 'google');
  authorizeUrl.searchParams.set('redirect_to', redirectTo);
  authorizeUrl.searchParams.set('code_challenge', challenge);
  authorizeUrl.searchParams.set('code_challenge_method', 's256');
  window.location.assign(authorizeUrl.toString());
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

/**
 * Creates a Supabase Auth account through the backend.
 */
export async function register(input: RegisterInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Signs in through Supabase Auth via the backend.
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Loads the profile associated with the active Supabase Auth token.
 */
export async function getCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me");
}

/**
 * Revokes the active Supabase Auth session.
 */
export async function logout(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/logout", {
    method: "POST",
  });
}
