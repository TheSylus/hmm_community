import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    // The `define` option allows us to replace global variables at compile time.
    // This is crucial for handling environment variables in a secure and modern way,
    // especially when deploying to services like Vercel.
    define: {
      // --- Vercel Environment Variable Bridge ---
      // This section acts as a bridge between your Vercel environment variables
      // and the variables expected by your client-side code (e.g., SDKs).

      // Why this is needed:
      // 1. Security: Vite, by default, only exposes environment variables prefixed
      //    with `VITE_` to the client to prevent accidentally leaking sensitive keys.
      // 2. SDK Compatibility: Some SDKs (like @google/genai) are hard-coded to look
      //    for specific variables like `process.env.API_KEY`. They don't know about
      //    Vite's `VITE_` prefix.

      // How it works:
      // - During the build process, Vite finds `env.VITE_GEMINI_API_KEY` (which you set in Vercel).
      // - It then replaces every occurrence of `process.env.API_KEY` in your code with the
      //   actual string value of your key.
      // - This means the final JavaScript bundle sent to the browser does not contain
      //   `process.env.API_KEY` but rather the key itself.

      // Required for @google/genai SDK
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      
      // Required for Supabase SDK
      'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    }
  }
})