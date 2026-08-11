-- Seed the initial product catalog images now that the products bucket has
-- been copied to the linked Supabase project.

DO $$
DECLARE
  dairy_category_id UUID;
  amul_gold_id UUID;
  amul_gold_500ml_id UUID;
  amul_gold_1l_id UUID;
  amul_masti_id UUID;
  amul_masti_380gm_id UUID;
  amul_masti_1kg_id UUID;
  storage_base_url TEXT := 'https://xvgqcarymebrxvbeumik.supabase.co/storage/v1/object/public/products';
BEGIN
  SELECT id INTO dairy_category_id
  FROM public.categories
  WHERE slug = 'dairy-bread-eggs';

  IF dairy_category_id IS NULL THEN
    RAISE EXCEPTION 'Required category dairy-bread-eggs was not found';
  END IF;

  SELECT id INTO amul_gold_id
  FROM public.products
  WHERE name = 'Amul Gold Milk'
    AND category_id = dairy_category_id
  LIMIT 1;

  IF amul_gold_id IS NULL THEN
    INSERT INTO public.products (category_id, name, description, brand)
    VALUES (
      dairy_category_id,
      'Amul Gold Milk',
      'Full cream milk, rich in calcium and nutrients.',
      'Amul'
    )
    RETURNING id INTO amul_gold_id;
  END IF;

  SELECT id INTO amul_gold_500ml_id
  FROM public.product_variants
  WHERE product_id = amul_gold_id
    AND unit = '500ml'
  LIMIT 1;

  IF amul_gold_500ml_id IS NULL THEN
    INSERT INTO public.product_variants (product_id, unit, price, stock, image_url)
    VALUES (
      amul_gold_id,
      '500ml',
      34,
      100,
      storage_base_url || '/1785842660086-amul-500-ml.png'
    )
    RETURNING id INTO amul_gold_500ml_id;
  ELSE
    UPDATE public.product_variants
    SET image_url = storage_base_url || '/1785842660086-amul-500-ml.png'
    WHERE id = amul_gold_500ml_id;
  END IF;

  SELECT id INTO amul_gold_1l_id
  FROM public.product_variants
  WHERE product_id = amul_gold_id
    AND unit = '1L'
  LIMIT 1;

  IF amul_gold_1l_id IS NULL THEN
    INSERT INTO public.product_variants (product_id, unit, price, stock, image_url)
    VALUES (
      amul_gold_id,
      '1L',
      62,
      100,
      storage_base_url || '/1785842660099-amul-1-L.png'
    )
    RETURNING id INTO amul_gold_1l_id;
  ELSE
    UPDATE public.product_variants
    SET image_url = storage_base_url || '/1785842660099-amul-1-L.png'
    WHERE id = amul_gold_1l_id;
  END IF;

  DELETE FROM public.product_images WHERE product_id = amul_gold_id;
  INSERT INTO public.product_images (product_id, image_url, position)
  VALUES
    (amul_gold_id, storage_base_url || '/1785842660086-amul-500-ml.png', 0),
    (amul_gold_id, storage_base_url || '/1785842660095-amul-500-ml-back.png', 1),
    (amul_gold_id, storage_base_url || '/1785842660099-amul-1-L.png', 2),
    (amul_gold_id, storage_base_url || '/1785842660102-amul-1-L-back.png', 3);

  DELETE FROM public.product_variant_images
  WHERE variant_id IN (amul_gold_500ml_id, amul_gold_1l_id);

  INSERT INTO public.product_variant_images (variant_id, image_url, position)
  VALUES
    (amul_gold_500ml_id, storage_base_url || '/1785842660086-amul-500-ml.png', 0),
    (amul_gold_500ml_id, storage_base_url || '/1785842660095-amul-500-ml-back.png', 1),
    (amul_gold_1l_id, storage_base_url || '/1785842660099-amul-1-L.png', 0),
    (amul_gold_1l_id, storage_base_url || '/1785842660102-amul-1-L-back.png', 1);

  SELECT id INTO amul_masti_id
  FROM public.products
  WHERE name = 'Amul Masti Dahi'
    AND category_id = dairy_category_id
  LIMIT 1;

  IF amul_masti_id IS NULL THEN
    INSERT INTO public.products (category_id, name, description, brand)
    VALUES (
      dairy_category_id,
      'Amul Masti Dahi',
      'Creamy curd for everyday meals and snacks.',
      'Amul'
    )
    RETURNING id INTO amul_masti_id;
  END IF;

  SELECT id INTO amul_masti_380gm_id
  FROM public.product_variants
  WHERE product_id = amul_masti_id
    AND unit = '380gm'
  LIMIT 1;

  IF amul_masti_380gm_id IS NULL THEN
    INSERT INTO public.product_variants (product_id, unit, price, stock, image_url)
    VALUES (
      amul_masti_id,
      '380gm',
      35,
      100,
      storage_base_url || '/1785845367318-amul-masti-dahi-380gm.png'
    )
    RETURNING id INTO amul_masti_380gm_id;
  ELSE
    UPDATE public.product_variants
    SET image_url = storage_base_url || '/1785845367318-amul-masti-dahi-380gm.png'
    WHERE id = amul_masti_380gm_id;
  END IF;

  SELECT id INTO amul_masti_1kg_id
  FROM public.product_variants
  WHERE product_id = amul_masti_id
    AND unit = '1kg'
  LIMIT 1;

  IF amul_masti_1kg_id IS NULL THEN
    INSERT INTO public.product_variants (product_id, unit, price, stock, image_url)
    VALUES (
      amul_masti_id,
      '1kg',
      75,
      100,
      storage_base_url || '/1785845367326-amul-masti-dahi-1-kg.png'
    )
    RETURNING id INTO amul_masti_1kg_id;
  ELSE
    UPDATE public.product_variants
    SET image_url = storage_base_url || '/1785845367326-amul-masti-dahi-1-kg.png'
    WHERE id = amul_masti_1kg_id;
  END IF;

  DELETE FROM public.product_images WHERE product_id = amul_masti_id;
  INSERT INTO public.product_images (product_id, image_url, position)
  VALUES
    (amul_masti_id, storage_base_url || '/1785845367318-amul-masti-dahi-380gm.png', 0),
    (amul_masti_id, storage_base_url || '/1785845367333-amul-masti-dahi-380gm-back.png', 1),
    (amul_masti_id, storage_base_url || '/1785845367326-amul-masti-dahi-1-kg.png', 2),
    (amul_masti_id, storage_base_url || '/1785845367328-amul-masti-dahi-1-kg-back.png', 3);

  DELETE FROM public.product_variant_images
  WHERE variant_id IN (amul_masti_380gm_id, amul_masti_1kg_id);

  INSERT INTO public.product_variant_images (variant_id, image_url, position)
  VALUES
    (amul_masti_380gm_id, storage_base_url || '/1785845367318-amul-masti-dahi-380gm.png', 0),
    (amul_masti_380gm_id, storage_base_url || '/1785845367333-amul-masti-dahi-380gm-back.png', 1),
    (amul_masti_1kg_id, storage_base_url || '/1785845367326-amul-masti-dahi-1-kg.png', 0),
    (amul_masti_1kg_id, storage_base_url || '/1785845367328-amul-masti-dahi-1-kg-back.png', 1);
END $$;
