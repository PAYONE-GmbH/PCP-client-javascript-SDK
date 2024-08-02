// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      include: ['src'],
      exclude: ['src/interfaces', 'src/_old', '**/*index.ts'],
      reporter: ['text', 'lcov'],
    },
    environment: 'jsdom',
  },
});
