import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { SERVER_PORT } from './src/shared/constants.ts';

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
        target: 'http://localhost:60011',
      },
    },
  },
});
