import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_PROXY_TARGET || 'https://greendg.craftassist.cloud';
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: false,
      proxy: {
        '/book': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/book/, '/api/book'),
        },
      },
    },
  };
})