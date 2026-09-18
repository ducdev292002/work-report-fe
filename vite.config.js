import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxying /api through the Vite dev server (and, in production, through the
// hosting platform's rewrites) keeps the frontend and API on the same origin
// so the httpOnly auth cookies aren't treated as third-party and blocked.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
