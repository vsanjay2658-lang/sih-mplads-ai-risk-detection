import { createClient } from "@supabase/supabase-js";

// Supabase URL and Publishable Anon Key (with safe fallbacks for Vercel/Production)
const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  "https://znppmfoudamjepmzjvbz.supabase.co";

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  "sb_publishable_DAXDttM85uPKKXtU0t0HOQ_UcvpDQmc";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: () => ({
        select: () => Promise.resolve({ data: [], count: 0, error: null }),
      }),
    };