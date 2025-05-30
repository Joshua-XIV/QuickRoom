import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_LOCAL_URL || 'http://localhost:5001',
          changeOrigin: true,
          secure: false,
        },
      },
      host: true,
      port: 3002,
    }
  }
});
