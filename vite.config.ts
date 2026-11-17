import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { SERVER_PORT, SERVER_PORT_DEV } from './src/shared/constants.ts';

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: './dist',
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: SERVER_PORT,
    proxy: {
      '/api': {
        changeOrigin: true,
        target: `http://127.0.0.1:${SERVER_PORT_DEV}`,
        ws: true,
      },
    },
  },
});
