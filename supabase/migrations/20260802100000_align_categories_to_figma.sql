-- Keep homepage/admin categories aligned with the Figma design.
--
-- This upserts the eight approved categories and prunes only unused legacy
-- categories so products are not deleted by the categories -> products cascade.

INSERT INTO public.categories (name, slug, image_url)
VALUES
  ('Dairy, Bread & Eggs', 'dairy-bread-eggs', NULL),
  ('Fruits & Vegetables', 'fruits-vegetables', NULL),
  ('Cold Drinks & Juices', 'cold-drinks-juices', NULL),
  ('Snacks & Munchies', 'snacks-munchies', NULL),
  ('Sweet Tooth', 'sweet-tooth', NULL),
  ('Tea, Coffee & Milk Drinks', 'tea-coffee-milk-drinks', NULL),
  ('Chicken, Meat & Fish', 'chicken-meat-fish', NULL),
  ('Cleaning Essentials', 'cleaning-essentials', NULL)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  image_url = EXCLUDED.image_url;

DELETE FROM public.categories AS category
WHERE category.slug NOT IN (
  'dairy-bread-eggs',
  'fruits-vegetables',
  'cold-drinks-juices',
  'snacks-munchies',
  'sweet-tooth',
  'tea-coffee-milk-drinks',
  'chicken-meat-fish',
  'cleaning-essentials'
)
AND NOT EXISTS (
  SELECT 1
  FROM public.products AS product
  WHERE product.category_id = category.id
);
