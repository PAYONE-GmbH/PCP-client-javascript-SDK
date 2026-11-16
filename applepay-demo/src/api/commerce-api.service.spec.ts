/** HTTP errors retain server details; neither network nor parsing failures trigger POST retries. */
import { afterEach, expect, it, vi } from 'vitest';
import { CommerceApiService } from './commerce-api.service';

afterEach(() => vi.unstubAllGlobals());

it('preserves HTTP failures and normalizes the API prefix', async () => {
  const details = { errors: [{ errorCode: '1201' }] };
  const fetch = vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => details });
  vi.stubGlobal('fetch', fetch);
  await expect(
    new CommerceApiService('https://api.test/api').createCommerceCase({}),
  ).rejects.toMatchObject({ kind: 'http', method: 'POST', status: 422, details });
  expect(fetch).toHaveBeenCalledOnce();
  expect(fetch.mock.calls[0][0].href).toBe('https://api.test/api/commerce-cases');
});

it('encodes IDs and distinguishes network/invalid-response failures', async () => {
  const fetch = vi
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('bad JSON');
      },
    });
  vi.stubGlobal('fetch', fetch);
  const api = new CommerceApiService('https://api.test/');
  await expect(api.getCheckout('case/id', 'checkout/id')).rejects.toMatchObject({
    kind: 'network',
    method: 'GET',
  });
  expect(fetch.mock.calls[0][0].href).toBe(
    'https://api.test/commerce-cases/case%2Fid/checkouts/checkout%2Fid',
  );
  await expect(api.createCommerceCase({})).rejects.toMatchObject({
    kind: 'invalid-response',
    method: 'POST',
  });
  expect(fetch).toHaveBeenCalledTimes(2);
});
