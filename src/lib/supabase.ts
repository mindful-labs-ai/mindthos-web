import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_WEBAPP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_WEBAPP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL과 Anon Key가 환경 변수에 설정되어 있지 않습니다.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
});
