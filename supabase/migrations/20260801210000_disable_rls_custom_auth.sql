-- Disable RLS on users and refresh_tokens tables to allow direct operations for local custom auth
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens DISABLE ROW LEVEL SECURITY;

-- Grant standard permissions to roles on public schema tables
GRANT ALL ON TABLE public.users TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.refresh_tokens TO postgres, anon, authenticated, service_role;
