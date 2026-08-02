-- Store multiple gallery images per product variant.
--
-- Product details switch galleries when the shopper selects a unit such as
-- 500 ml or 1 L. Product cards use the first image from the first variant.

CREATE TABLE IF NOT EXISTS public.product_variant_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.product_variant_images IS
  'Gallery images for a specific product variant, such as a 500 ml packet or a 1 L carton.';
COMMENT ON COLUMN public.product_variant_images.variant_id IS
  'Variant that owns this image. Deleted automatically when the variant is deleted.';
COMMENT ON COLUMN public.product_variant_images.image_url IS
  'Public Supabase Storage URL for this variant image.';
COMMENT ON COLUMN public.product_variant_images.position IS
  'Display order for this variant gallery.';

CREATE INDEX IF NOT EXISTS product_variant_images_variant_id_position_idx
  ON public.product_variant_images (variant_id, position);

ALTER TABLE public.product_variant_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read product_variant_images"
  ON public.product_variant_images
  FOR SELECT
  USING (true);

GRANT SELECT ON TABLE public.product_variant_images TO anon, authenticated;
GRANT ALL ON TABLE public.product_variant_images TO service_role;
