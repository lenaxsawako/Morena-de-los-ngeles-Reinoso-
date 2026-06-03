import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:3109';
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: false,
      proxy: {
        '/api/book': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
})