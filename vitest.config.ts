// vitest.config.ts

import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'pcp-client-javascript-sdk': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.{test,spec}.ts', '*-demo/src/**/*.{test,spec}.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/interfaces/**', 'src/tests/**', '**/*index.ts'],
      reporter: ['text', 'lcov'],
    },
    environment: 'jsdom',
  },
});
