// FIX: Removed vite/client type reference and switched to process.env, which is defined in vite.config.ts to resolve TypeScript errors.
import { createClient } from '@supabase/supabase-js';

// --- Vercel & Supabase Environment Variable Setup ---
// This file consumes environment variables that are made available to the client-side
// code by Vite's build process. The `process.env` variables here are NOT the raw
// variables from your Vercel environment.
//
// How it works:
// 1. In your Vercel project settings, you define your keys with a `VITE_` prefix,
//    for example: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
// 2. The `vite.config.ts` file reads these `VITE_` prefixed variables during the build.
// 3. The `define` block in `vite.config.ts` then creates global `process.env`
//    variables for your application, mapping the values. For example:
//    'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL)
// 4. This file then uses `process.env.SUPABASE_URL` to initialize the Supabase client.
//
// This setup ensures that only variables explicitly prefixed with `VITE_` are
// exposed to the browser, which is a critical security feature.

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Create the client but use empty strings as a fallback to prevent crashing.
// The client will not be functional, but the app will load.
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Export a flag to check if the configuration is actually present.
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);