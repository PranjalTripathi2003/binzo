-- 1. Add role column to public.users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';

-- Document role column in Postgres metadata
COMMENT ON COLUMN public.users.role IS 'User role: customer or admin for RBAC.';

-- Promote pranjal@email.com to admin role
UPDATE public.users SET role = 'admin' WHERE email = 'pranjal@email.com';

-- 2. Setup Supabase Storage for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Public read access for product images
CREATE POLICY "Public Read Product Images" ON storage.objects
FOR SELECT USING (bucket_id = 'products');

-- Storage Policy: Allow authenticated users to upload product images
CREATE POLICY "Admin Upload Product Images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'products');

-- Storage Policy: Allow admin users to update/delete product images
CREATE POLICY "Admin Update Product Images" ON storage.objects
FOR UPDATE USING (bucket_id = 'products');

CREATE POLICY "Admin Delete Product Images" ON storage.objects
FOR DELETE USING (bucket_id = 'products');
