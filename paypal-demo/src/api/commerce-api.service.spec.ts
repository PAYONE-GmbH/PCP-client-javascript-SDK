/** HTTP boundary: preserve failures, encode IDs and bound the intent-only GET retry. */
import { afterEach, expect, it, vi } from 'vitest';
import { CommerceApiService } from './commerce-api.service';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it('preserves HTTP details and never retries a POST', async () => {
  const details = { errors: [{ id: 'INVALID_VALUE' }] };
  const fetch = vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => details });
  vi.stubGlobal('fetch', fetch);
  await expect(
    new CommerceApiService('https://api.test/api').createCommerceCase({}),
  ).rejects.toMatchObject({ kind: 'http', method: 'POST', status: 422, details });
  expect(fetch).toHaveBeenCalledOnce();
  expect(fetch.mock.calls[0][0].href).toBe('https://api.test/api/commerce-cases');
});

it('encodes checkout IDs and distinguishes network from invalid JSON', async () => {
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
});

it('retries only transient/incomplete intent GETs and stops within two seconds', async () => {
  vi.useFakeTimers();
  const ready = {
    paymentIntentId: 'intent',
    redirectPaymentMethodSpecificOutput: {
      paymentProduct840SpecificOutput: { shippingAddress: { countryCode: 'DE' } },
    },
  };
  const fetch = vi
    .fn()
    .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ready });
  vi.stubGlobal('fetch', fetch);
  const api = new CommerceApiService('https://api.test/');
  const pending = api.getPaymentIntent('intent/id');
  await vi.runAllTimersAsync();
  expect(await pending).toEqual(ready);
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(fetch.mock.calls.every(([, options]) => options.method === 'GET')).toBe(true);
  fetch.mockReset().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
  const failure = expect(api.getPaymentIntent('intent')).rejects.toThrow('two-second');
  await vi.runAllTimersAsync();
  await failure;
  expect(fetch.mock.calls.length).toBeLessThanOrEqual(10);
  fetch.mockReset().mockResolvedValue({ ok: false, status: 400, json: async () => ({}) });
  await expect(api.getPaymentIntent('intent')).rejects.toMatchObject({ status: 400 });
  expect(fetch).toHaveBeenCalledOnce();
});
