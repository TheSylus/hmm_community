import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // This is required by the @google/genai SDK, which specifically looks for process.env.API_KEY.
      // We map the VITE_GEMINI_API_KEY from the environment (e.g., Vercel settings) to it.
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      // Expose Supabase keys to the client-side code via simpler process.env variables.
      'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    }
  }
})