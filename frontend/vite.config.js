import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:3000';
const hmrHost = process.env.VITE_HMR_HOST;

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: ['.gatien-duboc.fr', 'localhost', '127.0.0.1'],
    hmr: hmrHost
      ? {
          host: hmrHost,
          protocol: 'wss',
          clientPort: 443,
        }
      : true,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/uploads': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
});
