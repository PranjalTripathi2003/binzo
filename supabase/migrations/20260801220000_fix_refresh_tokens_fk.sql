-- Drop foreign key constraint on refresh_tokens referencing auth.users(id)
ALTER TABLE public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey;

-- Recreate the foreign key constraint pointing to the local custom users table (public.users)
ALTER TABLE public.refresh_tokens
  ADD CONSTRAINT refresh_tokens_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
