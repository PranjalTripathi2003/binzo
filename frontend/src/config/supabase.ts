const localSupabaseUrl = 'http://127.0.0.1:50321';
const localSupabasePublishableKey =
  'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (import.meta.env.DEV ? localSupabaseUrl : '');

export const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (import.meta.env.DEV ? localSupabasePublishableKey : '');
