import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Host/port are set for the cloud preview; a deployed Vercel build ignores them.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    allowedHosts: ['pv-21725626f9d4-f68782ba-2aa8-4541-8822-1144115f008e.style.dev'],
  },
  preview: { host: true, port: 3000, strictPort: true },
})
