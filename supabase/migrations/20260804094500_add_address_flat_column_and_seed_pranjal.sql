-- Migration: add flat address column and seed Pranjal's addresses
--
-- The original schema had structured columns (address_line_1, city, state,
-- postal_code) as NOT NULL. The backend AddressService instead exposes a
-- single flat `address` text field. This migration:
--   1. Drops NOT NULL from the legacy structured columns (they stay for
--      potential future use but are no longer required).
--   2. Adds the flat `address` text column used by the API.
--   3. Seeds Pranjal's user record (idempotent) so the FK is satisfied.
--   4. Seeds Pranjal's three delivery addresses.

-- 1. Relax NOT NULL on the legacy structured columns.
ALTER TABLE public.addresses
  ALTER COLUMN address_line_1 DROP NOT NULL,
  ALTER COLUMN city            DROP NOT NULL,
  ALTER COLUMN state           DROP NOT NULL,
  ALTER COLUMN postal_code     DROP NOT NULL;

-- 2. Add the flat address column.
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS address text;

COMMENT ON COLUMN public.addresses.address IS
  'Full delivery address as a single formatted string, used by the API.';

-- 3. Seed Pranjal's user row so the addresses FK is satisfied.
--    Password hash is the bcrypt hash of his existing password.
INSERT INTO public.users (id, email, name, role, password_hash, created_at, updated_at)
VALUES (
  '6236fefc-2876-4517-827f-c853791a12a1',
  'pranjal@email.com',
  'Pranjal',
  'admin',
  '$2b$10$pdIzplObn0k0S2haTYV02.4zX8BI.FZcz.lVyFfM5nWI/q5AnJ9Su',
  '2026-08-01T16:48:00.130199+00:00',
  '2026-08-02T02:50:31.763193+00:00'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed the three hardcoded addresses for Pranjal.
--    Only "Home" is marked as default; the trigger ensures uniqueness.
INSERT INTO public.addresses (user_id, label, address, is_default)
VALUES
  (
    '6236fefc-2876-4517-827f-c853791a12a1',
    'Home',
    '1701 A-Block, 4th Avenue, Gaur City 1, Greater Noida West, Uttar Pradesh',
    true
  ),
  (
    '6236fefc-2876-4517-827f-c853791a12a1',
    'Work',
    'H-221, 3rd Floor, BitsFlow Technologies, Noida, Uttar Pradesh',
    false
  ),
  (
    '6236fefc-2876-4517-827f-c853791a12a1',
    'Alternate',
    'A24, A Block, Sector 16, Noida, Uttar Pradesh',
    false
  )
ON CONFLICT DO NOTHING;

