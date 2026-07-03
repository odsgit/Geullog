import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Cloudflare Pages: build command `npm run build`, output directory `dist` (both are Vite defaults).
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  // Only these prefixes are exposed to client code via import.meta.env.
  // OPENAI_API_KEY intentionally does NOT match any prefix here — it must stay
  // server-side only, read from functions/ (Cloudflare Pages Functions) via context.env.
  envPrefix: ['VITE_', 'SUPABASE_', 'GA_', 'CLARITY_'],
})
