// Build both independent Apple Pay demo pages.
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: { input: { main: 'index.html', express: 'express.html' } },
  },
});
