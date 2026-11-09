/** Env-only configuration; SDK settings are required only for the official button page. */
import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it('requires base settings without hidden defaults', async () => {
  vi.stubEnv('VITE_BACKEND_BASE_URL', '');
  const { ConfigService } = await import('./config');
  expect(() => new ConfigService()).toThrow('Missing VITE_BACKEND_BASE_URL');
});

it('allows redirect pages without SDK IDs and validates SDK intent on access', async () => {
  vi.stubEnv('VITE_BACKEND_BASE_URL', ' https://api.test/ ');
  vi.stubEnv('VITE_SHIPPING_OPTION', 'express');
  vi.stubEnv('VITE_PAYPAL_CLIENT_ID', '');
  vi.stubEnv('VITE_PAYPAL_INTENT', 'invalid');
  const { ConfigService } = await import('./config');
  const config = new ConfigService();
  expect(config.backendUrl).toBe('https://api.test/');
  expect(() => config.clientId).toThrow('Missing VITE_PAYPAL_CLIENT_ID');
  expect(() => config.intent).toThrow('capture or authorize');
});
