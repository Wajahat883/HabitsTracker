import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// IMPORTANT: Your Google Cloud Console 'Authorized JavaScript origins' must match this URL exactly:
// http://localhost:5173
// If you change the port, update Google Cloud Console too.

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173, // Always use 5173 for Google OAuth local dev
    open: true,
    cors: true,
  }
})
