-- Ensure the seeded admin user keeps admin access after moving environments.
-- Earlier seed migrations could skip promotion if the user row already existed.

UPDATE public.users
SET
  role = 'admin',
  updated_at = now()
WHERE email = 'pranjal@email.com';
