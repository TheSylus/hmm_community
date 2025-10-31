// FIX: Removed vite/client type reference and switched to process.env, which is defined in vite.config.ts to resolve TypeScript errors.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key must be defined in your Vercel environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);