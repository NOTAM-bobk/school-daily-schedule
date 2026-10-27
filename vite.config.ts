import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Host/port are set for the cloud preview; a deployed Vercel build ignores them.
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 3000, strictPort: true },
  preview: { host: true, port: 3000, strictPort: true },
})
