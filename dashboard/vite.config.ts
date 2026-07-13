import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(() => ({
  // Served under /dashboard/ in the combined jk.experienceplus.ai deployment
  // (set by the root vercel-build); '/' for standalone dev.
  base: process.env.DASHBOARD_BASE || '/',
  server: {
    host: 'localhost',
    port: 8091,
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@jikken/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
}));
