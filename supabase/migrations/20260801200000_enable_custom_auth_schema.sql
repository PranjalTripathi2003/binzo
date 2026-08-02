-- 1. Alter public.users table to support local custom auth
-- Remove the foreign key constraint referencing auth.users(id)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Change the default value of id to generate UUID locally
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add the missing password_hash column for local custom auth password validation
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Drop the old handle_new_user trigger which relied on auth.users inserts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create the missing refresh_tokens table used by auth.service.ts
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document the changes in database metadata
COMMENT ON COLUMN public.users.password_hash IS 'Bcrypt hash of user password for local/custom auth validation.';
COMMENT ON TABLE public.refresh_tokens IS 'Hashed refresh tokens stored on login/register; deleted on logout.';
COMMENT ON COLUMN public.refresh_tokens.token_hash IS 'Bcrypt hash of the issued refresh JWT.';
COMMENT ON COLUMN public.refresh_tokens.expires_at IS 'Hard expiry for cleanup; should match the JWT exp claim (7 days).';
