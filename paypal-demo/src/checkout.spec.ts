import { describe, expect, it, vi } from 'vitest';
import type { PaymentIntentResponse } from 'pcp-client-javascript-sdk';
import {
  createExpressCheckout,
  createStandardCheckout,
  type PayPalExpressOptions,
} from './checkout';

const address = {
  countryCode: 'DE',
  city: 'Berlin',
  zip: '10115',
  street: 'Test 1',
  name: { firstName: 'Ada', surname: 'Lovelace' },
};
const intent: PaymentIntentResponse = {
  paymentIntentId: 'intent',
  paymentId: 'pay',
  redirectPaymentMethodSpecificOutput: {
    paymentProductId: 840,
    paymentProduct840SpecificOutput: {
      shippingAddress: address,
      billingAddress: { countryCode: 'DE' },
      customerAccount: { firstName: 'Ada', surname: 'Lovelace', emailAddress: 'ada@example.test' },
    },
  },
};
const context = { paymentIntentId: 'intent', paymentId: 'pay', phase: 'redirected' as const };

describe('PayPal checkout factories', () => {
  it('submits a frozen Standard merchant contact once with the redirect flags', async () => {
    const submit = vi
      .fn()
      .mockResolvedValue({ status: 'requires-action', redirectUrl: 'https://paypal.test/approve' });
    const onResult = vi.fn();
    const contact = {
      customer: { billingAddress: { countryCode: 'DE' } },
      shippingAddress: structuredClone(address),
    };
    const checkout = createStandardCheckout(
      { returnUrl: 'https://demo.test/', submit, onResult },
      contact,
      'express',
    );
    contact.shippingAddress.city = 'Changed';
    const first = checkout.pay();
    expect(checkout.pay()).toBe(first);
    await first;
    expect(submit).toHaveBeenCalledOnce();
    expect(submit.mock.calls[0][0].redirectPaymentMethodSpecificInput).toMatchObject({
      paymentProductId: 840,
      requiresApproval: false,
      tokenize: false,
      paymentProduct840SpecificInput: { addressSelectionAtPayPal: false, javaScriptSdkFlow: false },
    });
    expect(
      submit.mock.calls[0][0].redirectPaymentMethodSpecificInput.paymentProduct840SpecificInput,
    ).not.toHaveProperty('paymentId');
    expect(submit.mock.calls[0][1].shippingAddress.city).toBe('Berlin');
    expect(submit.mock.calls[0][2]).toBe('express');
    expect(onResult).toHaveBeenCalledWith(await first);
  });

  it('never retries an uncertain Standard payment on the same handle', async () => {
    const submit = vi.fn().mockRejectedValue(new Error('timeout'));
    const checkout = createStandardCheckout(
      { returnUrl: 'https://demo.test/', submit },
      { customer: {}, shippingAddress: address },
      'standard',
    );
    await expect(checkout.pay()).rejects.toThrow('timeout');
    await expect(checkout.pay()).rejects.toThrow('timeout');
    expect(submit).toHaveBeenCalledOnce();
  });

  const setup = () => {
    const options = {
      returnUrl: 'https://demo.test/express.html',
      createIntent: vi
        .fn()
        .mockResolvedValue({ ...context, redirectUrl: 'https://paypal.test/approve' }),
      loadIntent: vi.fn().mockResolvedValue(intent),
      submit: vi.fn().mockResolvedValue({ status: 'succeeded', paymentId: 'pay' }),
      persist: vi.fn(),
      review: vi.fn().mockReturnValue({
        shippingAddress: { ...address, city: 'Reviewed city' },
        shippingOptionId: 'express',
      }),
      navigate: vi.fn(),
      onResult: vi.fn(),
    } satisfies PayPalExpressOptions;
    return { options, checkout: createExpressCheckout(options) };
  };

  it('only creates an intent before redirect; review GET never submits an order', async () => {
    const { options, checkout } = setup();
    await checkout.start();
    expect(options.persist).toHaveBeenCalledWith(context);
    expect(options.navigate).toHaveBeenCalledWith('https://paypal.test/approve');
    expect(options.submit).not.toHaveBeenCalled();
    await checkout.resume(context);
    expect(options.loadIntent).toHaveBeenCalledWith('intent');
    expect(options.submit).not.toHaveBeenCalled();
    await checkout.confirm();
    expect(options.submit).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectPaymentMethodSpecificInput: expect.objectContaining({
          paymentProduct840SpecificInput: {
            paymentId: 'pay',
            addressSelectionAtPayPal: false,
            javaScriptSdkFlow: false,
          },
        }),
      }),
      {
        customer: {
          billingAddress: { countryCode: 'DE' },
          personalInformation: { name: { firstName: 'Ada', surname: 'Lovelace' } },
          contactDetails: { emailAddress: 'ada@example.test' },
        },
        shippingAddress: expect.objectContaining({ city: 'Reviewed city' }),
      },
      'express',
    );
  });

  it('refuses mismatched returned IDs and missing provider address before review', async () => {
    const { options, checkout } = setup();
    await checkout.resume(context);
    options.loadIntent.mockResolvedValueOnce({ ...intent, paymentId: 'other' });
    await expect(checkout.resume(context)).rejects.toThrow('correlation mismatch');
    await expect(checkout.confirm()).rejects.toThrow('Resume and review');
    options.loadIntent.mockResolvedValueOnce({
      ...intent,
      redirectPaymentMethodSpecificOutput: { paymentProductId: 840 },
    });
    await expect(checkout.resume(context)).rejects.toThrow('No PayPal shipping address');
    expect(options.submit).not.toHaveBeenCalled();
  });

  it('persists changed-price authorization before navigation and never submits it twice', async () => {
    const { options, checkout } = setup();
    const payment = { status: 'requires-action', redirectUrl: 'https://paypal.test/new-price' };
    options.submit.mockResolvedValue(payment);
    await checkout.resume(context);
    const first = checkout.confirm();
    expect(checkout.confirm()).toBe(first);
    await first;
    expect(options.persist).toHaveBeenLastCalledWith({
      ...context,
      phase: 'submitted',
      result: payment,
    });
    expect(options.navigate).toHaveBeenCalledWith(payment.redirectUrl);
    expect(options.submit).toHaveBeenCalledOnce();
  });

  it('rejects unsupported review country and cancellation after confirmation starts', async () => {
    const { options, checkout } = setup();
    options.review.mockReturnValue({
      shippingAddress: { ...address, countryCode: 'AT' },
      shippingOptionId: 'standard',
    });
    await checkout.resume(context);
    await expect(checkout.confirm()).rejects.toThrow('Germany');
    expect(() => checkout.cancel()).toThrow('reconciled');
    expect(options.submit).not.toHaveBeenCalled();
  });
});
