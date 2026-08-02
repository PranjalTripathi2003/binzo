-- Restore ordinary table privileges required by the API roles.
--
-- RLS policies decide which rows a role may access, but PostgreSQL still
-- requires SELECT/INSERT/UPDATE/DELETE grants before those policies run.
-- The backend Supabase client uses service_role and should be able to manage
-- application tables while bypassing RLS.

GRANT SELECT ON TABLE public.categories TO anon, authenticated;
GRANT SELECT ON TABLE public.products TO anon, authenticated;
GRANT SELECT ON TABLE public.product_variants TO anon, authenticated;

GRANT ALL ON TABLE public.categories TO service_role;
GRANT ALL ON TABLE public.products TO service_role;
GRANT ALL ON TABLE public.product_variants TO service_role;
GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON TABLE public.refresh_tokens TO service_role;
GRANT ALL ON TABLE public.addresses TO service_role;
GRANT ALL ON TABLE public.cart_items TO service_role;
GRANT ALL ON TABLE public.orders TO service_role;
GRANT ALL ON TABLE public.order_items TO service_role;
