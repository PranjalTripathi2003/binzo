UPDATE public.users
SET role = 'admin',
    updated_at = now()
WHERE email = 'pranjaltripathi226@gmail.com'
RETURNING id, email, role;