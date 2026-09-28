import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Modos:
//  - normal ("vite build"): juego para el servidor del colegio (modo clase).
//  - demo ("vite build --mode demo"): un solo HTML autónomo, modo práctica sin servidor.
export default defineConfig(({ mode }) => {
  const demo = mode === 'demo';
  return {
    plugins: [react(), ...(demo ? [viteSingleFile()] : [])],
    define: {
      __MODO_DEMO__: JSON.stringify(demo),
    },
    build: {
      outDir: demo ? 'dist-demo' : 'dist',
      emptyOutDir: true,
      target: 'es2022',
      assetsInlineLimit: demo ? 100_000_000 : 4096,
    },
    server: {
      proxy: { '/api': 'http://localhost:3000' },
    },
  };
});
