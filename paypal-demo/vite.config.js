// Build the three independent PayPal demo pages and serve them on port 5174.
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: { input: { main: 'index.html', sdk: 'sdk.html', express: 'express.html' } },
  },
  server: {
    port: 5174,
  },
});
