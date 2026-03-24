import { hasSupabaseEnv, supabase } from '../../lib/supabase/client';

export async function checkSupabaseConnection() {
  if (!hasSupabaseEnv() || !supabase) {
    return {
      ok: false,
      message: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.',
    };
  }

  const { error } = await supabase.from('categories').select('id').limit(1);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    message: 'Supabase connection is working.',
  };
}
