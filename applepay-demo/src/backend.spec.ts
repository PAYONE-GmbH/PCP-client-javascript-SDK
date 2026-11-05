import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { backendConfig, CommerceBackend, mapCheckout, mapCreated, quote } from './backend';
import { appleInput } from './payment';

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => sessionStorage.clear());

describe('existing Commerce API demo mapping', () => {
  const config = backendConfig(
    'https://demo.test/express.html?backendUrl=https%3A%2F%2Fapi.test%2Fprefix',
    {},
  );
  it('overrides the environment, preserves base paths and return configuration', () => {
    expect(config.backendUrl).toBe('https://api.test/prefix/');
    expect(new URL(config.returnUrl).searchParams.has('backendUrl')).toBe(false);
    expect(() => backendConfig('https://demo.test/?backendUrl=javascript:alert(1)', {})).toThrow(
      'HTTP(S)',
    );
    expect(() => backendConfig('https://demo.test/', {})).toThrow('Set backendUrl');
  });
  it('keeps long runtime configuration out of the 200-character return URL and restores it after redirects', () => {
    const href =
      'https://checkout.integration.example/express.html?backendUrl=https%3A%2F%2Fcommerce-api.integration.example%2Fapi%2F&validateMerchantUrl=https%3A%2F%2Fmerchant-validation.integration.example%2Fapple-pay%2Fvalidate-merchant';
    expect(href.length).toBeGreaterThan(200);
    const initial = backendConfig(href, {});
    expect(initial.returnUrl.length).toBeLessThanOrEqual(200);
    expect(new URL(initial.returnUrl).searchParams.has('validateMerchantUrl')).toBe(false);
    expect(backendConfig(`${initial.returnUrl}&provider=value`, {})).toEqual(initial);
    expect(
      backendConfig(initial.returnUrl, { VITE_BACKEND_BASE_URL: 'https://wrong.test/' }),
    ).toEqual(initial);
  });
  it('fails explicitly if return context is lost or the frontend path itself is too long', () => {
    expect(() => backendConfig('https://demo.test/express.html?context=missing', {})).toThrow(
      'Return configuration is missing',
    );
    expect(() =>
      backendConfig(`https://demo.test/${'x'.repeat(180)}?backendUrl=https://api.test/`, {}),
    ).toThrow('exceeds 200');
  });
  it('uses integer cents and rejects unsupported shipping countries or identifiers', () => {
    expect(quote('DE').total).toBe(2480);
    expect(quote('DE', 'express').total).toBe(2980);
    expect(() => quote('US')).toThrow('Germany');
    expect(() => quote('DE', 'invented')).toThrow('Unknown shipping');
  });
  it('calls the configured local backend API directly when merchant routing is server-managed', async () => {
    const local = backendConfig('https://demo.test/express.html', {
      VITE_BACKEND_BASE_URL: 'http://localhost:3009/api/',
    });
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ paymentIntentId: 'intent' }),
    });
    vi.stubGlobal('fetch', fetch);
    const backend = new CommerceBackend(local);
    await backend.request('commerce-cases');
    expect(String(fetch.mock.calls[0][0])).toBe('http://localhost:3009/api/commerce-cases');
    expect(backend.storageKey).toContain('backend-managed');
  });
  it('does not equate HTTP success or authorization with capture', () => {
    expect(mapCreated({}, 201).status).toBe('pending');
    expect(mapCreated({}, 202).status).toBe('failed');
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
      mapCreated(
        {
          checkout: {
            paymentResponse: {
              payment: { status: 'CAPTURED', statusOutput: { isAuthorized: false } },
            },
          },
        },
        201,
      ).status,
    ).toBe('succeeded');
  });
  it('maps 3DS actions and the distinct GET checkout shape', () => {
    expect(
      mapCreated(
        {
          commerceCaseId: 'case',
          checkout: {
            checkoutId: 'checkout',
            paymentResponse: {
              merchantAction: { redirectData: { redirectURL: 'https://issuer.test/' } },
            },
          },
        },
        201,
      ),
    ).toEqual({
      status: 'requires-action',
      redirectUrl: 'https://issuer.test/',
      commerceCaseId: 'case',
      checkoutId: 'checkout',
      paymentId: undefined,
    });
    expect(
      mapCheckout({ statusOutput: { paymentStatus: 'PAYMENT_COMPLETED' } }, { paymentId: 'pay' }),
    ).toEqual({ status: 'succeeded', paymentId: 'pay' });
    expect(
      mapCheckout({ paymentExecutions: [{ events: [{ paymentStatus: 'CANCELLED' }] }] }, {}).status,
    ).toBe('failed');
  });
  it('treats a created checkout with a downstream payment error as failed even on HTTP 200', () => {
    expect(
      mapCreated(
        {
          commerceCaseId: 'created-case',
          checkout: {
            checkoutId: 'created-checkout',
            paymentResponse: { payment: {} },
            errorResponse: {
              errors: [
                {
                  errorCode: '50001111',
                  propertyName: 'order.shoppingCart.items[0].orderLineDetails.productType',
                },
              ],
            },
          },
        },
        200,
      ).status,
    ).toBe('failed');
  });
  it('uses only existing routes, full-order fields, final contacts and no auth headers', async () => {
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
    const address = {
      countryCode: 'DE',
      city: 'Berlin',
      zip: '10115',
      street: 'Example 1',
      name: { surname: 'Customer' },
    };
    const result = await backend.createOrder({}, {}, address, 'express');
    expect(result.status).toBe('succeeded');
    expect(fetch.mock.calls[0][0].href).toBe('https://api.test/prefix/commerce-cases');
    const options = fetch.mock.calls[0][1];
    expect(options.credentials).toBe('omit');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
    const sent = JSON.parse(options.body);
    expect(sent.checkout.orderRequest.orderReferences.merchantReference).toBe(
      sent.checkout.references.merchantReference,
    );
    expect(sent.checkout.orderRequest.orderReferences.merchantReference).toMatch(/^[a-f0-9]{20}$/);
    expect(sent.checkout).toMatchObject({
      amountOfMoney: { amount: 2980, currencyCode: 'EUR' },
      autoExecuteOrder: true,
      shipping: { address },
      orderRequest: { orderType: 'FULL' },
    });
    expect(sent.checkout.shoppingCart.items).toHaveLength(2);
    expect(
      sent.checkout.shoppingCart.items.map(
        (item: { orderLineDetails: { productType: string } }) => item.orderLineDetails.productType,
      ),
    ).toEqual(['GOODS', 'SHIPMENT']);
    await expect(backend.createOrder({}, {}, address, 'express')).rejects.toThrow('already exists');
    expect(fetch).toHaveBeenCalledOnce();
  });
  it('persists an uncertain submission across a reload without storing token data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection lost')));
    const backend = new CommerceBackend(config);
    const address = {
      countryCode: 'DE',
      city: 'Berlin',
      zip: '10115',
      street: 'Example 1',
      name: { surname: 'Customer' },
    };
    await expect(
      backend.createOrder(
        { mobilePaymentMethodSpecificInput: { encryptedPaymentData: 'SECRET_TOKEN' } },
        {},
        address,
        'standard',
      ),
    ).rejects.toThrow('connection lost');
    expect(sessionStorage.getItem(backend.storageKey)).not.toContain('SECRET_TOKEN');
    const reloaded = new CommerceBackend(config);
    await expect(reloaded.createOrder({}, {}, address, 'standard')).rejects.toThrow(
      'already exists',
    );
  });
});

describe('wallet token mapping', () => {
  it('maps Apple EC_v1 components without re-encoding and rejects unsupported networks', () => {
    const payment = {
      token: {
        paymentMethod: { network: 'Visa' },
        paymentData: {
          data: 'encrypted',
          version: 'EC_v1',
          signature: 'signature',
          header: {
            publicKeyHash: 'key',
            ephemeralPublicKey: 'ephemeral',
            transactionId: 'transaction',
          },
        },
      },
    } as unknown as ApplePayJS.ApplePayPayment;
    expect(appleInput(payment, 'https://demo.test/return')).toMatchObject({
      paymentProductId: 302,
      encryptedPaymentData: 'encrypted',
      publicKeyHash: 'key',
      ephemeralKey: 'ephemeral',
      paymentProduct302SpecificInput: {
        integrationType: 'MERCHANT_CERTIFICATE',
        network: 'VISA',
        token: {
          version: 'EC_V1',
          signature: 'signature',
          header: { transactionId: 'transaction' },
        },
      },
    });
    payment.token.paymentMethod.network = 'Amex';
    expect(() => appleInput(payment, 'https://demo.test/return')).toThrow('Unsupported');
  });
});
