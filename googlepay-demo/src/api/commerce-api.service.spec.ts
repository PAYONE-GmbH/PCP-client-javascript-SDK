/** HTTP contract tests: preserve server errors and distinguish uncertain writes from read failures. */
import { afterEach, expect, it, vi } from 'vitest';
import { CommerceApiService } from './commerce-api.service';
afterEach(() => vi.unstubAllGlobals());

it('preserves structured HTTP error details without retrying', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue({ ok: false, status: 422, json: async () => ({ error: 'invalid cart' }) });
  vi.stubGlobal('fetch', fetch);
  await expect(
    new CommerceApiService('https://api.test/').createCommerceCase({}),
  ).rejects.toMatchObject({
    kind: 'http',
    method: 'POST',
    status: 422,
    details: { error: 'invalid cart' },
  });
  expect(fetch).toHaveBeenCalledOnce();
});

it('distinguishes network read failures and malformed write responses', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  await expect(
    new CommerceApiService('https://api.test/').getCheckout('case', 'checkout'),
  ).rejects.toMatchObject({
    kind: 'network',
    method: 'GET',
    message: expect.not.stringContaining('unknown'),
  });
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => {
        throw new Error('bad JSON');
      },
    }),
  );
  await expect(
    new CommerceApiService('https://api.test/').createCommerceCase({}),
  ).rejects.toMatchObject({ kind: 'invalid-response', method: 'POST' });
});
