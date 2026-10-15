-- Replace the temporary custom-auth schema with Supabase Auth as the identity source.
-- Account-linked data is intentionally removed for this fresh-start transition.

-- Remove account-owned rows before deleting custom users. Catalog and storage data stay intact.
DELETE FROM public.order_items;
DELETE FROM public.cart_items;
DELETE FROM public.orders;
DELETE FROM public.addresses;
DELETE FROM public.refresh_tokens;
DELETE FROM public.users;

DROP TABLE public.refresh_tokens;
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.users
  ADD CONSTRAINT users_id_fkey FOREIGN KEY (id)
  REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, public.users.name),
      phone = COALESCE(EXCLUDED.phone, public.users.phone);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.users FROM anon, authenticated;
GRANT ALL ON TABLE public.users TO service_role;

COMMENT ON TABLE public.users IS
  'Application profile rows linked to Supabase Auth identities in auth.users.';
COMMENT ON COLUMN public.users.id IS
  'Matches auth.users.id and cascades when the Supabase Auth account is deleted.';
