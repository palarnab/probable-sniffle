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
      dedupe: [
        '@cornerstonejs/core',
        '@cornerstonejs/tools',
        '@cornerstonejs/dicom-image-loader',
      ],
    },
    optimizeDeps: {
      include: [
        '@cornerstonejs/core',
        '@cornerstonejs/tools',
        'dicom-parser',
        '@cornerstonejs/codec-libjpeg-turbo-8bit',
        '@cornerstonejs/codec-libjpeg-turbo-8bit/decodewasmjs',
        '@cornerstonejs/codec-charls',
        '@cornerstonejs/codec-charls/decodewasmjs',
        '@cornerstonejs/codec-openjpeg',
        '@cornerstonejs/codec-openjpeg/decodewasmjs',
        '@cornerstonejs/codec-openjph',
        '@cornerstonejs/codec-openjph/wasmjs',
      ],
      exclude: [
        '@cornerstonejs/dicom-image-loader',
      ],
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
