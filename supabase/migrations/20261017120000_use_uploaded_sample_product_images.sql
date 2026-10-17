-- Replace the temporary third-party image links on the five sample products
-- with downloaded files uploaded to this project's local public products bucket.
DO $$
DECLARE
  item RECORD;
  resolved_variant_id UUID;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('cold-drinks-juices', 'Coca-Cola Soft Drink', '750ml', 'coca-cola-750ml.jpg'),
      ('snacks-munchies', 'Lay’s India’s Magic Masala Potato Chips', '58g', 'lays-magic-masala.png'),
      ('tea-coffee-milk-drinks', 'Nescafe Classic Instant Coffee Powder', '45g', 'nescafe-classic-45g.jpg'),
      ('tea-coffee-milk-drinks', 'Tata Tea Gold', '250g', 'tata-tea-gold-250g.jpg'),
      ('pet-care', 'Pedigree Dry Dog Food - Chicken Biryani', '1kg', 'pedigree-chicken-biryani-1kg.png')
    ) AS seed(category_slug, product_name, unit, file_name)
  LOOP
    SELECT variant.id INTO resolved_variant_id
    FROM public.product_variants AS variant
    JOIN public.products AS product ON product.id = variant.product_id
    JOIN public.categories AS category ON category.id = product.category_id
    WHERE category.slug = item.category_slug
      AND product.name = item.product_name
      AND variant.unit = item.unit
    LIMIT 1;

    IF resolved_variant_id IS NULL THEN
      RAISE EXCEPTION 'Sample product variant not found: % / %', item.product_name, item.unit;
    END IF;

    UPDATE public.product_variants
    SET image_url = 'http://127.0.0.1:50321/storage/v1/object/public/products/' || item.file_name
    WHERE id = resolved_variant_id;

    DELETE FROM public.product_variant_images
    WHERE variant_id = resolved_variant_id;

    INSERT INTO public.product_variant_images (variant_id, image_url, position)
    VALUES (
      resolved_variant_id,
      'http://127.0.0.1:50321/storage/v1/object/public/products/' || item.file_name,
      0
    );
  END LOOP;
END $$;

