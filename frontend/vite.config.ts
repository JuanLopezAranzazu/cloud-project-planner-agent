import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      proxy: env.VITE_API_TARGET
        ? { '/api': { target: env.VITE_API_TARGET, changeOrigin: true, secure: true } }
        : undefined,
    },
  };
});
