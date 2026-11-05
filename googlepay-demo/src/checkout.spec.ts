import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PCPGooglePayExpress, type PCPGooglePayExpressConfig } from 'pcp-client-javascript-sdk';
import type GooglePayButton from '@google-pay/button-element';
import {
  createExpressCheckout,
  createStandardCheckout,
  type GoogleCheckoutOptions,
} from './checkout';

vi.mock('@google-pay/button-element', () => {
  class Button extends HTMLElement {}
  customElements.define('test-google-button', Button);
  return { default: Button };
});

let options: GoogleCheckoutOptions;
const contact = {
  name: 'Example Buyer',
  countryCode: 'DE',
  address1: 'Example 1',
  locality: 'Berlin',
  postalCode: '10115',
} as google.payments.api.Address;
const payment = {
  paymentMethodData: {
    type: 'CARD',
    info: { cardNetwork: 'VISA', cardDetails: '1111' },
    tokenizationData: { token: 'original' },
  },
} as google.payments.api.PaymentData;

function intermediate(
  data: Partial<google.payments.api.IntermediatePaymentData>,
): google.payments.api.IntermediatePaymentData {
  return { callbackTrigger: 'INITIALIZE', paymentMethodData: payment.paymentMethodData, ...data };
}
const redacted = {
  countryCode: 'DE',
  administrativeArea: 'BE',
  locality: 'Berlin',
  postalCode: '10115',
};

beforeEach(() => {
  document.body.innerHTML = '<div id="wallet"></div>';
  options = {
    environment: 'TEST',
    gatewayMerchantId: 'P1_TEST',
    merchantName: 'My shop',
    buttonLocale: 'en',
    selector: '#wallet',
    submit: vi.fn().mockResolvedValue({ status: 'pending' }),
    onResult: vi.fn(),
    onError: vi.fn(),
    onCancel: vi.fn(),
  };
});
afterEach(() => vi.restoreAllMocks());

it('passes explicitly configured auth methods to both wallets without sharing mutable arrays', async () => {
  options.allowedAuthMethods = ['PAN_ONLY', 'CRYPTOGRAM_3DS'];
  await createStandardCheckout(options, contact, 'buyer@example.test', 'standard');
  const button = document.querySelector('test-google-button') as GooglePayButton;
  const create = vi
    .spyOn(PCPGooglePayExpress, 'create')
    .mockResolvedValue({ destroy: vi.fn() } as unknown as PCPGooglePayExpress);
  await createExpressCheckout(options);
  const standard = button.paymentRequest.allowedPaymentMethods[0].parameters!.allowedAuthMethods;
  const express =
    create.mock.calls[0][0].paymentRequest.allowedPaymentMethods[0].parameters!.allowedAuthMethods;
  expect(standard).toEqual(['PAN_ONLY', 'CRYPTOGRAM_3DS']);
  expect(express).toEqual(standard);
  options.allowedAuthMethods.length = 0;
  expect(standard).toHaveLength(2);
  expect(express).toHaveLength(2);
});

describe('Google Standard checkout', () => {
  const button = () => document.querySelector('test-google-button') as GooglePayButton;

  it('preserves a specific Google error when button-element subsequently reports false readiness', async () => {
    await createStandardCheckout(options, contact, 'buyer@example.test', 'standard');
    const error = { statusCode: 'DEVELOPER_ERROR', statusMessage: 'Google request rejected.' };
    button().onError!(error);
    button().onReadyToPayChange!({ isReadyToPay: false, isButtonVisible: false });
    expect(options.onError).toHaveBeenCalledExactlyOnceWith(error);
  });

  it('reports genuinely unavailable Google Pay when there is no more specific error', async () => {
    await createStandardCheckout(options, contact, 'buyer@example.test', 'standard');
    button().onReadyToPayChange!({ isReadyToPay: false, isButtonVisible: false });
    expect(options.onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Google Pay is not available.' }),
    );
  });

  it('uses a final merchant quote and immutable merchant contacts, without wallet contact selection', async () => {
    const address = { ...contact };
    await createStandardCheckout(options, address, 'buyer@example.test', 'express');
    const element = button();
    expect(element.environment).toBe('TEST');
    expect(element.paymentRequest.transactionInfo).toMatchObject({
      totalPrice: '29.80',
      totalPriceStatus: 'FINAL',
    });
    expect(element.paymentRequest.shippingAddressRequired).toBeUndefined();
    expect(element.paymentRequest.emailRequired).toBeUndefined();
    expect(element.paymentRequest.callbackIntents).toEqual(['PAYMENT_AUTHORIZATION']);
    expect(element.paymentRequest.allowedPaymentMethods[0]).toMatchObject({
      parameters: {
        allowedAuthMethods: ['CRYPTOGRAM_3DS'],
        allowedCardNetworks: ['VISA', 'MASTERCARD'],
      },
      tokenizationSpecification: {
        parameters: { gateway: 'payonegmbh', gatewayMerchantId: 'P1_TEST' },
      },
    });
    address.address1 = 'Changed';
    expect(await element.onPaymentAuthorized!(payment)).toEqual({ transactionState: 'SUCCESS' });
    expect(options.submit).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'buyer@example.test',
        shippingAddress: contact,
        paymentMethodData: expect.objectContaining({
          info: expect.objectContaining({ billingAddress: contact }),
        }),
      }),
      'express',
    );
    expect(options.onResult).not.toHaveBeenCalled();
    element.onLoadPaymentData!(payment);
    expect(options.onResult).toHaveBeenCalledWith({ status: 'pending' });
  });

  it('submits once for duplicate authorization callbacks and preserves requires-action', async () => {
    vi.mocked(options.submit).mockResolvedValue({
      status: 'requires-action',
      redirectUrl: 'https://issuer.test/',
    });
    await createStandardCheckout(options, contact, 'buyer@example.test', 'standard');
    const element = button();
    await Promise.all([
      element.onPaymentAuthorized!(payment),
      element.onPaymentAuthorized!(payment),
    ]);
    expect(options.submit).toHaveBeenCalledOnce();
    element.onLoadPaymentData!(payment);
    expect(options.onResult).toHaveBeenCalledWith({
      status: 'requires-action',
      redirectUrl: 'https://issuer.test/',
    });
  });

  it('rejects backend declines and uncertain failures without reporting paid or resubmitting', async () => {
    vi.mocked(options.submit).mockRejectedValue(new Error('timeout'));
    await createStandardCheckout(options, contact, 'buyer@example.test', 'standard');
    const element = button();
    expect(await element.onPaymentAuthorized!(payment)).toMatchObject({
      transactionState: 'ERROR',
    });
    await element.onPaymentAuthorized!(payment);
    expect(options.submit).toHaveBeenCalledOnce();
    expect(options.onError).toHaveBeenCalledOnce();
    element.onLoadPaymentData!(payment);
    expect(options.onResult).not.toHaveBeenCalled();
  });

  it('returns a native decline error and keeps cancellation before authorization retryable', async () => {
    vi.mocked(options.submit).mockResolvedValue({
      status: 'failed',
      code: 'DECLINED',
      message: 'Declined',
    });
    await createStandardCheckout(options, contact, 'buyer@example.test', 'standard');
    button().onCancel!({ statusCode: 'CANCELED', statusMessage: 'Cancelled' });
    expect(options.submit).not.toHaveBeenCalled();
    expect(options.onCancel).toHaveBeenCalledOnce();
    expect(await button().onPaymentAuthorized!(payment)).toMatchObject({
      transactionState: 'ERROR',
      error: { message: 'Declined' },
    });
  });

  it('removes its button, blocks new submissions and suppresses late results after destroy', async () => {
    let finish!: (result: { status: 'pending' }) => void;
    vi.mocked(options.submit).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const handle = await createStandardCheckout(options, contact, 'buyer@example.test', 'standard');
    const element = button();
    const pending = element.onPaymentAuthorized!(payment);
    handle.destroy();
    finish({ status: 'pending' });
    await pending;
    element.onLoadPaymentData!(payment);
    element.onError!(new Error('late'));
    element.onCancel!({ statusCode: 'CANCELED', statusMessage: 'Cancelled' });
    expect(document.querySelector('#wallet')!.children).toHaveLength(0);
    expect(options.onResult).not.toHaveBeenCalled();
    expect(options.onError).not.toHaveBeenCalled();
    expect(options.onCancel).not.toHaveBeenCalled();
  });

  it('rejects unknown shipping and unsupported countries before preparing a wallet', async () => {
    await expect(createStandardCheckout(options, contact, '', 'unknown')).rejects.toThrow(
      'Unknown',
    );
    await expect(
      createStandardCheckout(options, { ...contact, countryCode: 'US' }, '', 'standard'),
    ).rejects.toThrow('Germany');
  });
});

describe('Google Express checkout', () => {
  function setup() {
    let request!: PCPGooglePayExpressConfig;
    const create = vi.spyOn(PCPGooglePayExpress, 'create').mockImplementation(async (config) => {
      request = config;
      return { destroy: vi.fn() } as unknown as PCPGooglePayExpress;
    });
    return { create, request: () => request };
  }

  it('updates ESTIMATED to FINAL, accepts redacted INITIALIZE and never submits an intermediate address', async () => {
    const test = setup();
    await createExpressCheckout(options);
    const request = test.request();
    expect(request.paymentRequest.transactionInfo).toMatchObject({
      totalPrice: '24.80',
      totalPriceStatus: 'ESTIMATED',
    });
    expect(request.paymentRequest.emailRequired).toBe(true);
    expect(request.paymentRequest.allowedPaymentMethods[0].parameters?.billingAddressRequired).toBe(
      true,
    );
    expect(
      await request.paymentDataChangedCallback(
        intermediate({
          callbackTrigger: 'INITIALIZE',
          shippingOptionData: { id: 'shipping_option_unselected' },
        }),
      ),
    ).toMatchObject({ newTransactionInfo: { totalPrice: '24.80', totalPriceStatus: 'FINAL' } });
    const update = await request.paymentDataChangedCallback(
      intermediate({
        callbackTrigger: 'SHIPPING_OPTION',
        shippingAddress: redacted,
        shippingOptionData: { id: 'express' },
      }),
    );
    expect(update.newTransactionInfo?.totalPrice).toBe('29.80');
    expect(update.newShippingOptionParameters?.defaultSelectedOptionId).toBe('express');
    expect(options.submit).not.toHaveBeenCalled();
    const final = { ...payment, shippingAddress: contact, shippingOptionData: { id: 'express' } };
    await request.processPaymentCallback(final);
    expect(options.submit).toHaveBeenCalledWith(final, 'express');
  });

  it('returns address errors with synchronized totals and rejects mismatched final shipping', async () => {
    const test = setup();
    await createExpressCheckout(options);
    const request = test.request();
    expect(
      await request.paymentDataChangedCallback(
        intermediate({
          callbackTrigger: 'SHIPPING_ADDRESS',
          shippingAddress: { ...redacted, countryCode: 'US' },
        }),
      ),
    ).toMatchObject({
      newTransactionInfo: { totalPrice: '24.80' },
      error: { reason: 'SHIPPING_ADDRESS_UNSERVICEABLE' },
    });
    expect(() =>
      request.processPaymentCallback({
        ...payment,
        shippingAddress: contact,
        shippingOptionData: { id: 'express' },
      }),
    ).toThrow('match');
    expect(() => request.processPaymentCallback(payment)).toThrow('Missing');
    expect(options.submit).not.toHaveBeenCalled();
  });

  it('rejects unknown shipping IDs and restores the default on cancellation', async () => {
    const test = setup();
    await createExpressCheckout(options);
    const request = test.request();
    await expect(
      request.paymentDataChangedCallback(
        intermediate({ callbackTrigger: 'SHIPPING_OPTION', shippingOptionData: { id: 'unknown' } }),
      ),
    ).rejects.toThrow('Unknown');
    await request.paymentDataChangedCallback(
      intermediate({ callbackTrigger: 'SHIPPING_OPTION', shippingOptionData: { id: 'express' } }),
    );
    request.cancelCallback!();
    const update = await request.paymentDataChangedCallback(
      intermediate({ callbackTrigger: 'INITIALIZE' }),
    );
    expect(update.newTransactionInfo?.totalPrice).toBe('24.80');
    expect(options.onCancel).toHaveBeenCalledOnce();
  });
});
