import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { backendConfig, CommerceBackend, mapCreated, mapCheckout } from './backend';
import { paypalInput } from './payment';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
beforeEach(() => sessionStorage.clear());

it('creates the documented PayPal intent and reads the unwrapped GET response', async () => {
  const config = backendConfig(
    'https://demo.test/express.html?backendUrl=https%3A%2F%2Fapi.test%2Fprefix',
    {},
  );
  const fetch = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        paymentIntentOutput: {
          paymentIntentId: 'intent/id',
          paymentId: 'pay',
          redirectPaymentMethodSpecificOutput: {
            redirectData: { redirectURL: 'https://paypal.test/' },
          },
        },
      }),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        paymentIntentId: 'intent/id',
        paymentId: 'pay',
        redirectPaymentMethodSpecificOutput: {
          paymentProduct840SpecificOutput: { shippingAddress: { countryCode: 'DE' } },
        },
      }),
    });
  vi.stubGlobal('fetch', fetch);
  const backend = new CommerceBackend(config);
  expect(await backend.createIntent()).toEqual({
    paymentIntentId: 'intent/id',
    paymentId: 'pay',
    redirectUrl: 'https://paypal.test/',
  });
  expect(fetch.mock.calls[0][0].href).toBe('https://api.test/prefix/payment-intents');
  const request = JSON.parse(fetch.mock.calls[0][1].body);
  expect(request.paymentMethodSpecificInput.redirectPaymentMethodSpecificInput).toMatchObject({
    requiresApproval: false,
    paymentProductId: 840,
    paymentProduct840SpecificInput: { addressSelectionAtPayPal: true, javaScriptSdkFlow: false },
  });
  expect(request.references.merchantReference.length).toBeLessThanOrEqual(20);
  expect(
    request.shoppingCart.items.map(
      (item: { orderLineDetails: { productType: string } }) => item.orderLineDetails.productType,
    ),
  ).toEqual(['GOODS', 'SHIPMENT']);
  expect(await backend.loadIntent('intent/id')).toMatchObject({
    paymentIntentId: 'intent/id',
    paymentId: 'pay',
  });
  expect(fetch.mock.calls[1][0].href).toBe('https://api.test/prefix/payment-intents/intent%2Fid');
  expect(backend.storageKey).toBe('paypal:order:https://api.test/prefix/');
});

const address = {
  countryCode: 'DE',
  city: 'Berlin',
  zip: '10115',
  street: 'Test 1',
  name: { firstName: 'Ada', surname: 'Lovelace' },
};
const makeBackend = () =>
  new CommerceBackend(
    backendConfig('https://demo.test/express.html', {
      VITE_BACKEND_BASE_URL: 'https://api.test/prefix/',
    }),
  );

it('restores a short same-tab return URL and its original shipping configuration', () => {
  const config = backendConfig(
    'https://demo.test/express.html?backendUrl=https://api.test/prefix&shipping=express',
    {},
  );
  expect(config.shippingOptionId).toBe('express');
  expect(config.returnUrl.length).toBeLessThanOrEqual(200);
  expect(config.returnUrl).not.toContain('backendUrl');
  expect(backendConfig(config.returnUrl, {})).toEqual(config);
  expect(() => backendConfig('https://demo.test/?context=missing', {})).toThrow(
    'configuration is missing',
  );
  expect(() =>
    backendConfig('https://demo.test/?backendUrl=https://user:pass@api.test', {}),
  ).toThrow('without credentials');
  expect(() =>
    backendConfig('https://demo.test/?backendUrl=https://api.test&shipping=unknown', {}),
  ).toThrow('Unknown shipping');
});

it('creates a single auto-executed order with consistent cart cents and only persists IDs', async () => {
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
  const backend = makeBackend();
  const customer = { contactDetails: { emailAddress: 'ada@example.test' } };
  await expect(
    backend.createOrder(
      paypalInput(backend.config.returnUrl, 'intent-payment'),
      customer,
      address,
      'express',
    ),
  ).resolves.toMatchObject({ status: 'succeeded' });
  const request = JSON.parse(fetch.mock.calls[0][1].body);
  expect(request.checkout).toMatchObject({
    autoExecuteOrder: true,
    amountOfMoney: { amount: 2980, currencyCode: 'EUR' },
    orderRequest: {
      orderType: 'FULL',
      paymentMethodSpecificInput: {
        redirectPaymentMethodSpecificInput: {
          paymentProductId: 840,
          requiresApproval: false,
          paymentProduct840SpecificInput: {
            paymentId: 'intent-payment',
            addressSelectionAtPayPal: false,
            javaScriptSdkFlow: false,
          },
        },
      },
    },
  });
  expect(
    request.checkout.shoppingCart.items.reduce(
      (sum: number, item: { orderLineDetails: { productPrice: number; quantity: number } }) =>
        sum + item.orderLineDetails.productPrice * item.orderLineDetails.quantity,
      0,
    ),
  ).toBe(2980);
  expect(request.checkout.orderRequest.orderReferences.merchantReference).toBe(
    request.checkout.references.merchantReference,
  );
  expect(sessionStorage.getItem(backend.storageKey)).not.toContain('ada@');
  expect(backend.getAttempt()).toEqual({
    phase: 'created',
    reference: { commerceCaseId: 'case', checkoutId: 'checkout', paymentId: 'pay' },
  });
  await expect(
    backend.createOrder(paypalInput(backend.config.returnUrl), customer, address, 'standard'),
  ).rejects.toThrow('already exists');
  expect(fetch).toHaveBeenCalledOnce();
});

it('persists an uncertain intent POST guard before the request and never retries it', async () => {
  const backend = makeBackend();
  const fetch = vi.fn().mockImplementation(async () => {
    expect(sessionStorage.getItem(`${backend.storageKey}:intent-attempt`)).toBe('submitting');
    throw new Error('connection lost');
  });
  vi.stubGlobal('fetch', fetch);
  await expect(backend.createIntent()).rejects.toThrow('connection lost');
  await expect(makeBackend().createIntent()).rejects.toThrow('already exists');
  expect(fetch).toHaveBeenCalledOnce();
});

it('locks an uncertain order across reload and rejects invalid shipping before POST', async () => {
  const backend = makeBackend();
  const fetch = vi.fn().mockRejectedValue(new Error('connection lost'));
  vi.stubGlobal('fetch', fetch);
  await expect(
    backend.createOrder(
      paypalInput(backend.config.returnUrl),
      {},
      { ...address, countryCode: 'AT' },
      'standard',
    ),
  ).rejects.toThrow('German shipping');
  expect(fetch).not.toHaveBeenCalled();
  await expect(
    backend.createOrder(paypalInput(backend.config.returnUrl), {}, address, 'standard'),
  ).rejects.toThrow('connection lost');
  await expect(
    makeBackend().createOrder(paypalInput(backend.config.returnUrl), {}, address, 'standard'),
  ).rejects.toThrow('already exists');
  expect(fetch).toHaveBeenCalledOnce();
});

it('retries transient/incomplete intent reads, without creating any payment', async () => {
  vi.useFakeTimers();
  const ready = {
    paymentIntentId: 'intent',
    paymentId: 'pay',
    redirectPaymentMethodSpecificOutput: {
      paymentProduct840SpecificOutput: { shippingAddress: address },
    },
  };
  const fetch = vi
    .fn()
    .mockResolvedValueOnce({ ok: false, status: 404 })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ paymentIntentId: 'intent' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ready });
  vi.stubGlobal('fetch', fetch);
  const pending = makeBackend().loadIntent('intent');
  await vi.runAllTimersAsync();
  await expect(pending).resolves.toEqual(ready);
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(fetch.mock.calls.every(([, options]) => options.method === undefined)).toBe(true);
});

it('bounds intent reads to two seconds and does not retry permanent errors', async () => {
  vi.useFakeTimers();
  const fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });
  vi.stubGlobal('fetch', fetch);
  const failure = expect(makeBackend().loadIntent('intent')).rejects.toThrow('two-second');
  await vi.runAllTimersAsync();
  await failure;
  expect(fetch.mock.calls.length).toBeLessThanOrEqual(10);
  fetch.mockReset().mockResolvedValue({ ok: false, status: 400 });
  await expect(makeBackend().loadIntent('intent')).rejects.toThrow('HTTP 400');
  expect(fetch).toHaveBeenCalledOnce();
});

it('distinguishes provider redirects, downstream failure, authorization and completed checkout', async () => {
  expect(
    mapCreated(
      {
        checkout: {
          paymentResponse: {
            merchantAction: { redirectData: { redirectURL: 'https://paypal.test/approve' } },
          },
        },
      },
      201,
    ),
  ).toMatchObject({ status: 'requires-action' });
  expect(mapCreated({ checkout: { errorResponse: { errors: [{}] } } }, 200).status).toBe('failed');
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
    mapCheckout(
      {
        statusOutput: { paymentStatus: 'WAITING_FOR_PAYMENT' },
        paymentExecutions: [{ events: [{ paymentStatus: 'CAPTURED' }] }],
      },
      {},
    ).status,
  ).toBe('pending');
  expect(mapCheckout({ statusOutput: { paymentStatus: 'PAYMENT_COMPLETED' } }, {}).status).toBe(
    'succeeded',
  );
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ statusOutput: { paymentStatus: 'PAYMENT_COMPLETED' } }),
  });
  vi.stubGlobal('fetch', fetch);
  await makeBackend().status({ commerceCaseId: 'case/id', checkoutId: 'checkout/id' });
  expect(fetch.mock.calls[0][0].href).toBe(
    'https://api.test/prefix/commerce-cases/case%2Fid/checkouts/checkout%2Fid',
  );
});

it('returns the PayPal SDK order ID, persists correlation and confirms status before reading checkout', async () => {
  const backend = makeBackend();
  const fetch = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        commerceCaseId: 'case/id',
        checkout: {
          checkoutId: 'checkout/id',
          paymentResponse: {
            payment: {
              id: 'PAYONE-ID',
              status: 'PENDING_APPROVAL',
              paymentOutput: {
                redirectPaymentMethodSpecificOutput: { payPalTransactionId: 'PAYPAL-ID' },
              },
            },
          },
        },
      }),
    })
    .mockImplementationOnce(async (_url, request) => {
      expect(backend.getAttempt()).toMatchObject({ completion: 'submitting' });
      expect(JSON.parse(request.body)).toEqual({
        completePaymentMethodSpecificInput: {
          paymentProduct840SpecificInput: {
            javaScriptSdkFlow: true,
            action: 'CONFIRM_ORDER_STATUS',
          },
        },
      });
      return { ok: true, status: 200, json: async () => ({ payment: { status: 'CAPTURED' } }) };
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ statusOutput: { paymentStatus: 'PAYMENT_COMPLETED' } }),
    });
  vi.stubGlobal('fetch', fetch);
  const input = paypalInput(backend.config.returnUrl);
  input.redirectPaymentMethodSpecificInput!.paymentProduct840SpecificInput!.javaScriptSdkFlow =
    true;
  const order = await backend.createSdkOrder(input, {}, address, 'standard');
  expect(order).toEqual({
    commerceCaseId: 'case/id',
    checkoutId: 'checkout/id',
    paymentId: 'PAYONE-ID',
    orderId: 'PAYPAL-ID',
  });
  const completion = backend.completeSdkOrder(order);
  expect(backend.completeSdkOrder(order)).toBe(completion);
  await expect(completion).resolves.toMatchObject({ status: 'succeeded' });
  expect(fetch.mock.calls[1][0].href).toBe(
    'https://api.test/prefix/commerce-cases/case%2Fid/checkouts/checkout%2Fid/complete-order',
  );
  expect(fetch).toHaveBeenCalledTimes(3);
  await expect(makeBackend().completeSdkOrder(order)).rejects.toThrow('already started');
});

it('does not substitute a PAYONE payment ID for a missing PayPal transaction ID', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        commerceCaseId: 'case',
        checkout: { checkoutId: 'checkout', paymentResponse: { payment: { id: 'PAYONE-ID' } } },
      }),
    }),
  );
  const backend = makeBackend();
  await expect(
    backend.createSdkOrder(paypalInput(backend.config.returnUrl), {}, address, 'standard'),
  ).rejects.toThrow('payPalTransactionId');
  expect(backend.getAttempt()?.reference?.paymentId).toBe('PAYONE-ID');
});

it('does not retry an uncertain complete-order POST across reload or accept foreign correlation IDs', async () => {
  const backend = makeBackend();
  const order = { commerceCaseId: 'case', checkoutId: 'checkout', orderId: 'PAYPAL-ID' };
  sessionStorage.setItem(
    backend.storageKey,
    JSON.stringify({
      phase: 'created',
      sdkOrderId: order.orderId,
      reference: { commerceCaseId: 'case', checkoutId: 'checkout' },
    }),
  );
  const fetch = vi.fn().mockRejectedValue(new Error('timeout'));
  vi.stubGlobal('fetch', fetch);
  await expect(backend.completeSdkOrder({ ...order, checkoutId: 'other' })).rejects.toThrow(
    'mismatch',
  );
  await expect(backend.completeSdkOrder(order)).rejects.toThrow('timeout');
  await expect(backend.completeSdkOrder(order)).rejects.toThrow('timeout');
  await expect(makeBackend().completeSdkOrder(order)).rejects.toThrow('already started');
  expect(fetch).toHaveBeenCalledOnce();
});

it.each([
  { status: 200, body: { payment: { status: 'REJECTED' } } },
  { status: 202, body: {} },
  { status: 200, body: { errorResponse: { errors: [{ id: 'INVALID_VALUE' }] } } },
])(
  'surfaces failed complete-order responses despite HTTP success: %j',
  async ({ status, body }) => {
    const backend = makeBackend();
    const order = { commerceCaseId: 'case', checkoutId: 'checkout', orderId: 'PAYPAL-ID' };
    sessionStorage.setItem(
      backend.storageKey,
      JSON.stringify({ phase: 'created', sdkOrderId: order.orderId, reference: order }),
    );
    const fetch = vi.fn().mockResolvedValue({ ok: true, status, json: async () => body });
    vi.stubGlobal('fetch', fetch);
    await expect(backend.completeSdkOrder(order)).resolves.toMatchObject({ status: 'failed' });
    expect(fetch).toHaveBeenCalledOnce();
    expect(backend.getAttempt()).toMatchObject({ completion: 'completed' });
  },
);
