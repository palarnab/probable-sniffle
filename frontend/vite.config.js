import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = parseInt(env.PORT || '4002', 10);
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:4001';

  return {
    plugins: [react(), tailwindcss(), wasm(), topLevelAwait()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    worker: {
      format: 'es',
      plugins: () => [wasm(), topLevelAwait()],
      rollupOptions: {
        external: ['@icr/polyseg-wasm'],
      },
    },
    build: {
      rollupOptions: {
        external: ['@icr/polyseg-wasm'],
      },
    },
    server: {
      host: '0.0.0.0',
      port,
      strictPort: true,
      proxy: {
        '/api': backendUrl,
        '/socket.io': { target: backendUrl, ws: true },
      },
    },
    preview: {
      host: '0.0.0.0',
      port,
    },
  };
});
