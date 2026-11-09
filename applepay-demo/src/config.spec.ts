/** Required env settings fail early and never fall back to query parameters. */
import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

it('reports missing env by name', async () => {
  vi.stubEnv('VITE_BACKEND_BASE_URL', '');
  const { ConfigService } = await import('./config');
  expect(() => new ConfigService()).toThrow('Missing VITE_BACKEND_BASE_URL');
});

it('validates the merchant-validation endpoint', async () => {
  vi.stubEnv('VITE_BACKEND_BASE_URL', 'https://api.test/');
  vi.stubEnv('VITE_VALIDATE_MERCHANT_URL', 'javascript:alert(1)');
  vi.stubEnv('VITE_APPLE_MERCHANT_NAME', 'Shop');
  vi.stubEnv('VITE_APPLE_BUTTON_LOCALE', 'de-DE');
  const { ConfigService } = await import('./config');
  expect(() => new ConfigService()).toThrow('HTTP(S)');
});
