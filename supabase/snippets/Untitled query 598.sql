-- Supporting SQL snippet for auth refresh-token storage.
--
-- This file is not a migration yet. Move it into supabase/migrations before
-- expecting a fresh database to support AuthService.register/login/logout.
create table refresh_tokens(
id uuid primary key default gen_random_uuid(),
user_id uuid references auth.users(id) on delete cascade,
token_hash text not null,
expires_at timestamp not null,
revoked boolean default false,
created_at timestamp default now()
);
