import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Backend (ASP.NET Core) в dev-режиме слушает http://localhost:5017.
// Запросы /api и /health проксируются на него dev-сервером Vite,
// поэтому браузер считает их запросами на свой же origin и CORS не требуется.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_PROXY_TARGET || 'http://localhost:5017';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target, changeOrigin: true },
        '/health': { target, changeOrigin: true },
      },
    },
  };
});
