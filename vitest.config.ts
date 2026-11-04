// vitest.config.ts
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'applepay-demo/**'],
    coverage: {
      include: ['src'],
      exclude: ['src/interfaces', '**/*index.ts'],
      reporter: ['text', 'lcov'],
    },
    environment: 'jsdom',
  },
});
