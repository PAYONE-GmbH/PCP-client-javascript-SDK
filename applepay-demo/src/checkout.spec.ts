import { afterEach, describe, expect, it, vi } from 'vitest';
import { PCPApplePaySession, type PCPApplePaySessionConfig } from 'pcp-client-javascript-sdk';
import {
  createExpressCheckout,
  createStandardCheckout,
  type AppleCheckoutOptions,
} from './checkout';

afterEach(() => vi.restoreAllMocks());

function setup() {
  let request!: PCPApplePaySessionConfig;
  const instance = { destroy: vi.fn() } as unknown as PCPApplePaySession;
  const create = vi.spyOn(PCPApplePaySession, 'create').mockImplementation(async (config) => {
    request = config;
    return instance;
  });
  const options: AppleCheckoutOptions = {
    validateMerchantURL: 'https://merchant.example/validate-merchant',
    label: 'My shop',
    applePayVersion: 5,
    supportedNetworks: ['visa'],
    button: { selector: '#wallet', config: { buttonstyle: 'black', type: 'buy', locale: 'en-GB' } },
    submit: vi.fn().mockResolvedValue({ status: 'pending' }),
    onResult: vi.fn(),
    onCancel: vi.fn(),
    onError: vi.fn(),
  };
  return { options, create, instance, request: () => request };
}

describe('Apple checkout demo factories', () => {
  it('uses the merchant checkout snapshot and selected total for Standard without wallet address selection', async () => {
    const test = setup();
    const contact = { countryCode: 'DE', givenName: 'Example', addressLines: ['Example 1'] };
    expect(await createStandardCheckout(test.options, contact, 'express')).toBe(test.instance);
    const request = test.request();
    expect(request.total).toEqual({ label: 'My shop', amount: '29.80', type: 'final' });
    expect(request.applePayVersion).toBe(5);
    expect(request.supportedNetworks).toEqual(['visa']);
    expect(request.validateMerchantURL).toBe(test.options.validateMerchantURL);
    expect(test.create).toHaveBeenCalledWith(request, test.options.button);
    expect(request.requiredShippingContactFields).toBeUndefined();
    expect(request.shippingMethods).toBeUndefined();
    contact.addressLines[0] = 'Edited after preparation';
    const payment = {
      token: { transactionIdentifier: 'test' },
      shippingContact: { countryCode: 'US' },
    } as ApplePayJS.ApplePayPayment;
    await expect(request.processPaymentCallback!(payment)).resolves.toEqual({ status: 'pending' });
    expect(test.options.submit).toHaveBeenCalledWith(
      {
        ...payment,
        billingContact: { ...contact, addressLines: ['Example 1'] },
        shippingContact: { ...contact, addressLines: ['Example 1'] },
      },
      'express',
    );
    expect(request.resultCallback).toBe(test.options.onResult);
  });

  it('rejects unsupported Standard shipping/country before creating a wallet', () => {
    const test = setup();
    expect(() => createStandardCheckout(test.options, { countryCode: 'US' }, 'standard')).toThrow(
      'Germany',
    );
    expect(() => createStandardCheckout(test.options, { countryCode: 'DE' }, 'unknown')).toThrow(
      'Unknown',
    );
    expect(test.create).not.toHaveBeenCalled();
  });

  it('recalculates Express shipping and submits final wallet contacts without treating a preview as final', async () => {
    const test = setup();
    await createExpressCheckout(test.options);
    const request = test.request();
    expect(request.requiredShippingContactFields).toContain('postalAddress');
    expect(request.total.amount).toBe('24.80');
    const update = await request.shippingMethodSelectedCallback!({
      identifier: 'express',
    } as ApplePayJS.ApplePayShippingMethod);
    expect(update.newTotal.amount).toBe('29.80');
    await request.shippingContactAddressSelectedCallback!({ countryCode: 'DE' });
    expect(test.options.submit).not.toHaveBeenCalled();
    const payment = {
      shippingContact: { countryCode: 'DE', locality: 'Berlin' },
    } as ApplePayJS.ApplePayPayment;
    await request.processPaymentCallback!(payment);
    expect(test.options.submit).toHaveBeenCalledWith(payment, 'express');
    request.cancelCallback!();
    expect(test.options.onCancel).toHaveBeenCalledOnce();
    await request.processPaymentCallback!(payment);
    expect(test.options.submit).toHaveBeenLastCalledWith(payment, 'standard');
  });

  it('returns a native address error for unsupported Express destinations', async () => {
    const test = setup();
    vi.stubGlobal(
      'ApplePayError',
      class {
        constructor(
          public code: string,
          public contactField: string,
          public message: string,
        ) {}
      },
    );
    try {
      await createExpressCheckout(test.options);
      const update = await test.request().shippingContactAddressSelectedCallback!({
        countryCode: 'US',
      });
      expect(update.newShippingMethods).toEqual([]);
      expect(update.errors?.[0]).toMatchObject({
        code: 'shippingContactInvalid',
        contactField: 'countryCode',
      });
      expect(test.options.submit).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
