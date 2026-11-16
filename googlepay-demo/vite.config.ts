/** Demo build configuration: serve locally and build both HTML entry pages. */
import { defineConfig } from 'vite';

export default defineConfig({
  build: { rollupOptions: { input: { main: 'index.html', express: 'express.html' } } },
});
