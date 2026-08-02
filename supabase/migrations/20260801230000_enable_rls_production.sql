-- Re-enable Row Level Security (RLS) on all public tables to secure database for Cloud deployment
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Note on Access Architecture:
-- 1. NestJS Backend uses the `SUPABASE_SERVICE_ROLE_KEY`. In Supabase, service_role automatically bypasses RLS policies.
-- 2. Public catalog (categories, products, product_variants) can be safely read by anyone (anon and authenticated).

-- RLS Policies for Catalog Read-Access (Anon & Authenticated)
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read product_variants" ON public.product_variants FOR SELECT USING (true);

-- Revoke direct table access from `anon` & `authenticated` roles for sensitive user data
-- This ensures frontend clients CANNOT query users/refresh_tokens directly via Supabase REST endpoints,
-- forcing all user/auth operations to route securely through the NestJS backend.
REVOKE ALL ON TABLE public.users FROM anon, authenticated;
REVOKE ALL ON TABLE public.refresh_tokens FROM anon, authenticated;
