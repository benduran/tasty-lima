import path from 'node:path';
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
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: SERVER_PORT,
  },
});
