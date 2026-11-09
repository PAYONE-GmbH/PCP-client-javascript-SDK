/** Express entry: quote-only callbacks, final wallet contacts and reload reconciliation. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type {
  PCPApplePaySession as AppleSession,
  PCPApplePaySessionConfig,
} from 'pcp-client-javascript-sdk';

let request: PCPApplePaySessionConfig;
const destroy = vi.fn();
beforeEach(() => {
  vi.resetModules();
  sessionStorage.clear();
  destroy.mockClear();
  for (const [key, value] of Object.entries({
    VITE_BACKEND_BASE_URL: 'https://api.test/api/',
    VITE_VALIDATE_MERCHANT_URL: 'https://api.test/validate',
    VITE_APPLE_MERCHANT_NAME: 'Test shop',
    VITE_APPLE_BUTTON_LOCALE: 'de-DE',
  })) {
    vi.stubEnv(key, value);
  }
  document.body.innerHTML =
    '<div id="wallet"></div><p id="status"></p><button id="check-status"></button>';
  vi.stubGlobal('ApplePayError', class extends Error {});
});
afterEach(() => {
  window.dispatchEvent(new Event('pagehide'));
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  document.body.replaceChildren();
});
const payment = {
  token: {
    paymentMethod: { network: 'Visa' },
    paymentData: {
      data: 'encrypted',
      signature: 'signature',
      version: 'EC_v1',
      header: {
        publicKeyHash: 'key',
        ephemeralPublicKey: 'ephemeral',
        transactionId: 'transaction',
      },
    },
  },
  shippingContact: {
    countryCode: 'DE',
    locality: 'Berlin',
    postalCode: '10115',
    addressLines: ['Test 1'],
    givenName: 'Ada',
    familyName: 'Example',
    emailAddress: 'ada@example.test',
  },
  billingContact: { countryCode: 'DE', locality: 'Bonn', familyName: 'Billing' },
} as unknown as ApplePayJS.ApplePayPayment;
async function setup() {
  const { PCPApplePaySession } = await import('pcp-client-javascript-sdk');
  const create = vi.spyOn(PCPApplePaySession, 'create').mockImplementation(async (config) => {
    request = config;
    return { destroy } as any;
  });
  await import('./express');
  await vi.waitFor(() => expect(create).toHaveBeenCalled());
  return create;
}

it('updates shipping without POST and submits final contacts with matching total/cart', async () => {
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({
      commerceCaseId: 'case',
      checkout: { checkoutId: 'checkout', paymentResponse: { payment: { status: 'CAPTURED' } } },
    }),
  });
  vi.stubGlobal('fetch', fetch);
  await setup();
  expect(request.requiredShippingContactFields).toContain('email');
  expect(
    (await request.shippingContactAddressSelectedCallback!({ countryCode: 'US' })).errors,
  ).toHaveLength(1);
  expect(
    (await request.shippingMethodSelectedCallback!({ identifier: 'express' } as any)).newTotal
      .amount,
  ).toBe('29.80');
  expect(fetch).not.toHaveBeenCalled();
  expect(await request.processPaymentCallback!(payment)).toMatchObject({ status: 'succeeded' });
  await expect(request.processPaymentCallback!(payment)).rejects.toThrow('already exists');
  const body = JSON.parse(fetch.mock.calls[0][1].body);
  expect(body.checkout.amountOfMoney.amount).toBe(2980);
  expect(body.checkout.shipping.address.city).toBe('Berlin');
  expect(body.customer.billingAddress.city).toBe('Bonn');
  expect(body.checkout.orderRequest.orderReferences.merchantReference).toBe(
    body.checkout.references.merchantReference,
  );
  expect(fetch).toHaveBeenCalledOnce();
});

it('rejects invalid final addresses before POST and suppresses late callbacks', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  await setup();
  await expect(
    request.processPaymentCallback!({ ...payment, shippingContact: { countryCode: 'AT' } }),
  ).rejects.toThrow('German shipping');
  expect(fetch).not.toHaveBeenCalled();
  window.dispatchEvent(new Event('pagehide'));
  request.cancelCallback!();
  await expect(request.processPaymentCallback!(payment)).rejects.toThrow('closed');
  expect(destroy).toHaveBeenCalled();
});

it('reads a saved checkout without creating another wallet', async () => {
  sessionStorage.setItem(
    'express:apple:https://api.test/api/:backend-managed',
    JSON.stringify({ reference: { commerceCaseId: 'case/id', checkoutId: 'checkout/id' } }),
  );
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ statusOutput: { paymentStatus: 'PAYMENT_COMPLETED' } }),
  });
  vi.stubGlobal('fetch', fetch);
  const { PCPApplePaySession } = await import('pcp-client-javascript-sdk');
  const create = vi.spyOn(PCPApplePaySession, 'create');
  await import('./express');
  await vi.waitFor(() =>
    expect(document.querySelector('#status')!.textContent).toContain('captured'),
  );
  expect(create).not.toHaveBeenCalled();
  expect(fetch.mock.calls[0][1].method).toBe('GET');
});

it('destroys a button that finishes initializing after navigation', async () => {
  const { PCPApplePaySession } = await import('pcp-client-javascript-sdk');
  let finish!: (session: AppleSession) => void;
  const create = vi.spyOn(PCPApplePaySession, 'create').mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await import('./express');
  await vi.waitFor(() => expect(create).toHaveBeenCalledOnce());
  window.dispatchEvent(new Event('pagehide'));
  finish({ destroy } as unknown as AppleSession);
  await vi.waitFor(() => expect(destroy).toHaveBeenCalledOnce());
  expect(document.querySelector('#status')!.textContent).not.toContain('Choose Apple Pay');
});
