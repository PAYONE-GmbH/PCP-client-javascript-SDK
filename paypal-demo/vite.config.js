import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: { input: { main: 'index.html', sdk: 'sdk.html', express: 'express.html' } },
  },
  server: {
    port: 5174,
  },
});
