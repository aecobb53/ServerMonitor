import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // CONTROL_CORE_URL lives in the repo-root .env, which is shared with docker compose.
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const target = env.CONTROL_CORE_URL;

  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': { target, changeOrigin: true },
      '/control-core/admin': { target, changeOrigin: true },
    },
  },
  };
})
