import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { backendConfig, CommerceBackend, mapCheckout, mapCreated } from './backend';
import { quote } from './pricing';

beforeEach(() => sessionStorage.clear());
afterEach(() => vi.unstubAllGlobals());
const address = {
  countryCode: 'DE',
  city: 'Berlin',
  zip: '10115',
  street: 'Example 1',
  name: { surname: 'Buyer' },
};
const config = { backendUrl: 'https://backend.test/prefix/', returnUrl: 'https://shop.test/' };

it('keeps runtime configuration out of the short return URL and restores it in the same tab', () => {
  const initial = backendConfig(
    'https://demo.test/express.html?backendUrl=https://api.test/long-prefix/&gatewayMerchantId=P1_test',
    {},
  );
  expect(initial.backendUrl).toBe('https://api.test/long-prefix/');
  expect(initial.returnUrl.length).toBeLessThanOrEqual(200);
  expect(initial.returnUrl).not.toContain('backendUrl');
  expect(initial.returnUrl).not.toContain('gatewayMerchantId');
  expect(
    backendConfig(initial.returnUrl, { VITE_BACKEND_BASE_URL: 'https://wrong.test/' }),
  ).toEqual(initial);
  expect(() => backendConfig('https://demo.test/?context=missing', {})).toThrow('missing');
});

it('rejects malformed backend URLs and missing configuration', () => {
  for (const url of [
    'javascript:alert(1)',
    'https://user:pass@api.test/',
    'https://api.test/?key=secret',
  ]) {
    expect(() =>
      backendConfig(`https://demo.test/?backendUrl=${encodeURIComponent(url)}`, {}),
    ).toThrow('HTTP(S)');
  }
  expect(() => backendConfig('https://demo.test/', {})).toThrow('Set backendUrl');
});

it('uses a single SALE order with matching cent totals, references, cart and contacts', async () => {
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({
      commerceCaseId: 'case',
      checkout: {
        checkoutId: 'checkout',
        paymentResponse: { payment: { id: 'pay', status: 'CAPTURED' } },
      },
    }),
  });
  vi.stubGlobal('fetch', fetch);
  const backend = new CommerceBackend(config);
  const input = {
    mobilePaymentMethodSpecificInput: {
      paymentProductId: 320,
      encryptedPaymentData: 'base64-token',
    },
  };
  expect((await backend.createOrder(input, {}, address, 'express')).status).toBe('succeeded');
  const [url, options] = fetch.mock.calls[0];
  expect(url.href).toBe('https://backend.test/prefix/commerce-cases');
  expect(options.credentials).toBe('omit');
  expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
  const sent = JSON.parse(options.body);
  expect(sent.checkout).toMatchObject({
    amountOfMoney: { amount: 2980, currencyCode: 'EUR' },
    shipping: { address },
    autoExecuteOrder: true,
    orderRequest: { orderType: 'FULL', paymentMethodSpecificInput: input },
  });
  expect(sent.checkout.references.merchantReference).toBe(
    sent.checkout.orderRequest.orderReferences.merchantReference,
  );
  const lines = sent.checkout.shoppingCart.items.map((item: any) => item.orderLineDetails);
  expect(lines.map((line: any) => line.productType)).toEqual(['GOODS', 'SHIPMENT']);
  expect(lines.reduce((sum: number, line: any) => sum + line.productPrice * line.quantity, 0)).toBe(
    2980,
  );
  await expect(backend.createOrder(input, {}, address, 'express')).rejects.toThrow(
    'already exists',
  );
  expect(fetch).toHaveBeenCalledOnce();
  const saved = sessionStorage.getItem(backend.storageKey)!;
  expect(saved).not.toContain('base64-token');
  expect(saved).not.toContain('Example 1');
});

it('locks uncertain POSTs across reloads and never retries payment automatically', async () => {
  const fetch = vi.fn().mockRejectedValue(new Error('timeout'));
  vi.stubGlobal('fetch', fetch);
  const backend = new CommerceBackend(config);
  await expect(backend.createOrder({}, {}, address, 'standard')).rejects.toThrow('timeout');
  const restored = new CommerceBackend(config);
  await expect(restored.createOrder({}, {}, address, 'standard')).rejects.toThrow('already exists');
  expect(restored.getAttempt()).toEqual({ phase: 'submitting' });
  expect(fetch).toHaveBeenCalledOnce();
});

it('validates final addresses and shipping IDs before creating an attempt', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const backend = new CommerceBackend(config);
  await expect(backend.createOrder({}, {}, { ...address, street: '' }, 'standard')).rejects.toThrow(
    'complete',
  );
  await expect(backend.createOrder({}, {}, address, 'unknown')).rejects.toThrow('Unknown');
  expect(backend.getAttempt()).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  expect(quote('DE').total).toBe(2480);
  expect(quote('DE', 'express').total).toBe(2980);
});

it('maps HTTP acceptance and authorization as pending, but capture and completed checkout as paid', () => {
  expect(mapCreated({}, 201).status).toBe('pending');
  expect(mapCreated({}, 202).status).toBe('failed');
  expect(mapCreated({ checkout: { errorResponse: {} } }, 200).status).toBe('failed');
  expect(
    mapCreated(
      {
        checkout: {
          paymentResponse: {
            payment: { status: 'PENDING_CAPTURE', statusOutput: { isAuthorized: true } },
          },
        },
      },
      201,
    ).status,
  ).toBe('pending');
  expect(
    mapCreated({ checkout: { paymentResponse: { payment: { status: 'CAPTURED' } } } }, 201).status,
  ).toBe('succeeded');
  expect(mapCheckout({ statusOutput: { paymentStatus: 'PAYMENT_COMPLETED' } }, {}).status).toBe(
    'succeeded',
  );
  expect(
    mapCheckout({ paymentExecutions: [{ events: [{ paymentStatus: 'CAPTURED' }] }] }, {}).status,
  ).toBe('pending');
});

it('reports a downstream product configuration failure even when Commerce returns HTTP 200', () => {
  expect(
    mapCreated(
      {
        commerceCaseId: 'created-case',
        checkout: {
          checkoutId: 'created-checkout',
          paymentResponse: { payment: {} },
          errorResponse: {
            errorId: 'platform-error',
            errors: [{ errorCode: '1201', id: 'PAYMENT_PRODUCT_CONFIGURATION_ERROR' }],
          },
        },
      },
      200,
    ),
  ).toMatchObject({
    status: 'failed',
    code: 'PAYMENT_PRODUCT_CONFIGURATION_ERROR',
    message: expect.stringContaining('product 320'),
  });
});

it('preserves 3DS references and reconciles via the encoded GET checkout endpoint', async () => {
  const result = mapCreated(
    {
      commerceCaseId: 'case',
      checkout: {
        checkoutId: 'checkout',
        paymentResponse: {
          merchantAction: { redirectData: { redirectURL: 'https://issuer.test/3ds' } },
        },
      },
    },
    201,
  );
  expect(result).toMatchObject({
    status: 'requires-action',
    commerceCaseId: 'case',
    checkoutId: 'checkout',
    redirectUrl: 'https://issuer.test/3ds',
  });
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ statusOutput: { paymentStatus: 'PAYMENT_COMPLETED' } }),
  });
  vi.stubGlobal('fetch', fetch);
  const backend = new CommerceBackend(config);
  expect(
    (await backend.status({ commerceCaseId: 'case/id', checkoutId: 'checkout/id' })).status,
  ).toBe('succeeded');
  expect(fetch.mock.calls[0][0].href).toBe(
    'https://backend.test/prefix/commerce-cases/case%2Fid/checkouts/checkout%2Fid',
  );
  await expect(backend.status({})).rejects.toThrow('Missing');
});
