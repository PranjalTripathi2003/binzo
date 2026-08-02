-- Store multiple gallery images per product.
--
-- Product cards use the first image. Product details render every image in
-- position order as the main gallery plus thumbnails.

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.product_images IS
  'Gallery images for a product. Product cards use the first image and details pages show the gallery.';
COMMENT ON COLUMN public.product_images.product_id IS
  'Product that owns this gallery image. Deleted automatically when the product is deleted.';
COMMENT ON COLUMN public.product_images.image_url IS
  'Public Supabase Storage URL for the product image.';
COMMENT ON COLUMN public.product_images.position IS
  'Display order for product gallery images.';

CREATE INDEX IF NOT EXISTS product_images_product_id_position_idx
  ON public.product_images (product_id, position);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read product_images"
  ON public.product_images
  FOR SELECT
  USING (true);

GRANT SELECT ON TABLE public.product_images TO anon, authenticated;
GRANT ALL ON TABLE public.product_images TO service_role;
