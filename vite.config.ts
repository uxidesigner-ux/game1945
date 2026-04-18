import { defineConfig } from 'vite';

/** Set to `/your-repo/` for GitHub Project Pages (see `npm run build:gh-pages`). */
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  server: { port: 5173, open: false },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) return 'phaser';
        },
      },
    },
  },
});
