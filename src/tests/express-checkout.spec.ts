import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PCPApplePaySession,
  PCPGooglePayExpress,
  type PCPApplePaySessionConfig,
  type PCPGooglePayExpressConfig,
  type ExpressPaymentResult,
} from '../index.js';

const success: ExpressPaymentResult = { status: 'succeeded', paymentId: 'payment' };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Apple Pay Express', () => {
  let native: any;
  let config: PCPApplePaySessionConfig;
  let paymentRequest: ApplePayJS.ApplePayPaymentRequest;
  class NativeSession {
    static canMakePayments = () => true;
    static STATUS_SUCCESS = 1;
    static STATUS_FAILURE = 0;
    begin = vi.fn();
    abort = vi.fn();
    completePayment = vi.fn();
    completeShippingContactSelection = vi.fn();
    constructor(_version: number, request: ApplePayJS.ApplePayPaymentRequest) {
      paymentRequest = request;
      native = this;
    }
  }
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '<div id="wallet"></div>';
    config = {
      applePayVersion: 4,
      countryCode: 'DE',
      currencyCode: 'EUR',
      merchantCapabilities: ['supports3DS'],
      supportedNetworks: ['visa', 'masterCard'],
      total: { label: 'Demo', amount: '24.80' },
      validateMerchantURL: '/validate-merchant',
      processPaymentCallback: vi.fn().mockResolvedValue(success),
      resultCallback: vi.fn(),
      cancelCallback: vi.fn(),
      errorCallback: vi.fn(),
    };
    vi.stubGlobal('ApplePaySession', undefined);
  });
  async function create() {
    // A unique script ID isolates independent tests while production instances share one load.
    config.applePayButtonId = `apple-${Math.random()}`;
    const promise = PCPApplePaySession.create(config, {
      selector: '#wallet',
      config: { buttonstyle: 'black', type: 'buy', locale: 'de-DE' },
    });
    vi.stubGlobal('ApplePaySession', NativeSession);
    document.getElementById(config.applePayButtonId)!.dispatchEvent(new Event('load'));
    const instance = await promise;
    document.querySelector<HTMLElement>('apple-pay-button')!.click();
    return instance;
  }
  it('loads the SDK before testing capability (non-Safari handoff path)', async () => {
    const instance = await create();
    expect(native.begin).toHaveBeenCalledOnce();
    instance.destroy();
  });
  it('passes only cloneable payment data to the cross-browser Apple SDK', async () => {
    config.shippingContactAddressSelectedCallback = vi.fn();
    config.shippingMethodSelectedCallback = vi.fn();
    config.paymentMethodSelectedCallback = vi.fn();
    config.couponCodeChangedCallback = vi.fn();
    config.requiredShippingContactFields = ['postalAddress', 'email'];
    config.shippingMethods = [
      { identifier: 'standard', label: 'Standard', amount: '4.90', detail: '' },
    ];
    const original = { ...config };
    const instance = await create();
    expect(native.begin).toHaveBeenCalledOnce();
    expect(() => structuredClone(paymentRequest)).not.toThrow();
    expect(paymentRequest).toEqual({
      countryCode: 'DE',
      currencyCode: 'EUR',
      merchantCapabilities: ['supports3DS'],
      supportedNetworks: ['visa', 'masterCard'],
      total: { label: 'Demo', amount: '24.80' },
      requiredShippingContactFields: ['postalAddress', 'email'],
      shippingMethods: config.shippingMethods,
    });
    expect(config).toMatchObject(original);
    native.oncancel();
    expect(config.cancelCallback).toHaveBeenCalledOnce();
    instance.destroy();
  });
  it('reuses an official SDK already evaluated by the application', async () => {
    vi.stubGlobal('ApplePaySession', NativeSession);
    vi.spyOn(customElements, 'get').mockReturnValue(class extends HTMLElement {});
    const instance = await PCPApplePaySession.create(config, {
      selector: '#wallet',
      config: { buttonstyle: 'black', type: 'buy', locale: 'de-DE' },
    });
    expect(document.querySelector('script')).toBeNull();
    instance.destroy();
  });
  it('rejects ambiguous URL and callback processing configuration', async () => {
    config.processPaymentURL = '/process-payment';
    await expect(
      PCPApplePaySession.create(config, {
        selector: '#wallet',
        config: { buttonstyle: 'black', type: 'buy', locale: 'de-DE' },
      }),
    ).rejects.toThrow('only one');
  });
  it('passes the final token and contacts, closes the sheet, and reports backend success', async () => {
    await create();
    const payment = { token: { paymentData: 'encrypted' }, shippingContact: { countryCode: 'DE' } };
    native.onpaymentauthorized({ payment });
    await vi.waitFor(() => expect(config.resultCallback).toHaveBeenCalledWith(success));
    expect(config.processPaymentCallback).toHaveBeenCalledWith(payment);
    expect(native.completePayment).toHaveBeenCalledWith(1);
  });
  it.each(['pending', 'requires-action'] as const)('does not report %s as paid', async (status) => {
    const result =
      status === 'pending' ? { status } : { status, redirectUrl: 'https://issuer.test/' };
    vi.mocked(config.processPaymentCallback!).mockResolvedValue(result);
    await create();
    native.onpaymentauthorized({ payment: {} });
    await vi.waitFor(() => expect(config.resultCallback).toHaveBeenCalledWith(result));
  });
  it('completes failure on backend rejection', async () => {
    vi.mocked(config.processPaymentCallback!).mockRejectedValue(new Error('offline'));
    await create();
    native.onpaymentauthorized({ payment: {} });
    await vi.waitFor(() => expect(config.errorCallback).toHaveBeenCalled());
    expect(native.completePayment).toHaveBeenCalledWith(0);
    expect(config.resultCallback).not.toHaveBeenCalled();
  });
  it('completes failure on a declined result', async () => {
    vi.mocked(config.processPaymentCallback!).mockResolvedValue({
      status: 'failed',
      code: 'declined',
      message: 'Declined',
    });
    await create();
    native.onpaymentauthorized({ payment: {} });
    await vi.waitFor(() => expect(native.completePayment).toHaveBeenCalledWith(0));
  });
  it('reports cancellation and permits a new sheet', async () => {
    await create();
    native.oncancel();
    expect(config.cancelCallback).toHaveBeenCalledOnce();
    document.querySelector<HTMLElement>('apple-pay-button')!.click();
    expect(native.begin).toHaveBeenCalledOnce();
  });
  it('submits only once and ignores completion after destroy', async () => {
    let resolve!: (result: ExpressPaymentResult) => void;
    vi.mocked(config.processPaymentCallback!).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const instance = await create();
    native.onpaymentauthorized({ payment: {} });
    native.onpaymentauthorized({ payment: {} });
    instance.destroy();
    resolve(success);
    await Promise.resolve();
    expect(config.processPaymentCallback).toHaveBeenCalledOnce();
    expect(native.abort).toHaveBeenCalledOnce();
    expect(native.completePayment).not.toHaveBeenCalled();
    expect(document.querySelector('apple-pay-button')).toBeNull();
  });
  it('rejects script download failures before showing a button', async () => {
    config.applePayButtonId = 'failed-apple';
    const promise = PCPApplePaySession.create(config, {
      selector: '#wallet',
      config: { buttonstyle: 'black', type: 'buy', locale: 'de-DE' },
    });
    document.getElementById('failed-apple')!.dispatchEvent(new Event('error'));
    await expect(promise).rejects.toThrow('Failed to load wallet script');
    expect(document.querySelector('apple-pay-button')).toBeNull();
  });
});

describe('Google Pay Express', () => {
  let callbacks: any;
  let click: () => void;
  let config: PCPGooglePayExpressConfig;
  let load: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    document.body.innerHTML = '<div id="google"></div>';
    load = vi.fn(async () => {
      await callbacks.onPaymentAuthorized({ email: 'final@example.test' });
      return {};
    });
    class Client {
      constructor(options: any) {
        callbacks = options.paymentDataCallbacks;
      }
      isReadyToPay = async () => ({ result: true });
      createButton = (options: any) => {
        click = options.onClick;
        return document.createElement('button');
      };
      loadPaymentData = load;
    }
    vi.stubGlobal('google', { payments: { api: { PaymentsClient: Client } } });
    config = {
      environment: 'TEST',
      paymentRequest: {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [],
        merchantInfo: { merchantName: 'Demo', merchantId: 'test' },
        shippingAddressRequired: true,
        callbackIntents: ['PAYMENT_AUTHORIZATION', 'SHIPPING_ADDRESS'],
        transactionInfo: { currencyCode: 'EUR', totalPriceStatus: 'FINAL', totalPrice: '24.80' },
      },
      paymentDataChangedCallback: vi
        .fn()
        .mockResolvedValue({ newTransactionInfo: { totalPrice: '24.80' } }),
      processPaymentCallback: vi.fn().mockResolvedValue(success),
      resultCallback: vi.fn(),
      cancelCallback: vi.fn(),
      errorCallback: vi.fn(),
    };
  });
  it('updates the redacted contact without authorizing', async () => {
    await PCPGooglePayExpress.create(config, { selector: '#google' });
    const redacted = { shippingAddress: { countryCode: 'DE' } };
    expect(await callbacks.onPaymentDataChanged(redacted)).toEqual({
      newTransactionInfo: { totalPrice: '24.80' },
    });
    expect(config.paymentDataChangedCallback).toHaveBeenCalledWith(redacted);
    expect(config.processPaymentCallback).not.toHaveBeenCalled();
  });
  it('waits for backend success and reports the result after the sheet closes', async () => {
    await PCPGooglePayExpress.create(config, { selector: '#google' });
    click();
    await vi.waitFor(() => expect(config.resultCallback).toHaveBeenCalledWith(success));
    expect(config.processPaymentCallback).toHaveBeenCalledWith({ email: 'final@example.test' });
  });
  it('does not authorize twice for duplicate callbacks', async () => {
    await PCPGooglePayExpress.create(config, { selector: '#google' });
    await Promise.all([callbacks.onPaymentAuthorized({}), callbacks.onPaymentAuthorized({})]);
    expect(config.processPaymentCallback).toHaveBeenCalledOnce();
  });
  it('returns authorization errors for rejected backend requests', async () => {
    vi.mocked(config.processPaymentCallback).mockRejectedValue(new Error('offline'));
    await PCPGooglePayExpress.create(config, { selector: '#google' });
    expect(await callbacks.onPaymentAuthorized({})).toMatchObject({ transactionState: 'ERROR' });
    expect(config.errorCallback).toHaveBeenCalledOnce();
  });
  it('returns a native authorization error for an explicit backend decline', async () => {
    vi.mocked(config.processPaymentCallback).mockResolvedValue({
      status: 'failed',
      code: 'DECLINED',
      message: 'Declined by issuer',
    });
    await PCPGooglePayExpress.create(config, { selector: '#google' });
    expect(await callbacks.onPaymentAuthorized({})).toMatchObject({
      transactionState: 'ERROR',
      error: { message: 'Declined by issuer' },
    });
  });
  it.each(['pending', 'requires-action'] as const)(
    'preserves a backend %s result rather than reporting paid',
    async (status) => {
      const result: ExpressPaymentResult =
        status === 'pending' ? { status } : { status, redirectUrl: 'https://issuer.test/' };
      vi.mocked(config.processPaymentCallback).mockResolvedValue(result);
      await PCPGooglePayExpress.create(config, { selector: '#google' });
      click();
      await vi.waitFor(() => expect(config.resultCallback).toHaveBeenCalledWith(result));
    },
  );
  it('rejects a configuration missing Express callback intents', async () => {
    config.paymentRequest.callbackIntents = ['PAYMENT_AUTHORIZATION'];
    await expect(PCPGooglePayExpress.create(config, { selector: '#google' })).rejects.toThrow(
      'Express requires',
    );
  });
  it('reports SDK download failures without submitting a payment', async () => {
    vi.stubGlobal('google', undefined);
    const promise = PCPGooglePayExpress.create(config, { selector: '#google' });
    document.getElementById('google-pay-sdk')!.dispatchEvent(new Event('error'));
    await expect(promise).rejects.toThrow('Failed to load wallet script');
    expect(config.processPaymentCallback).not.toHaveBeenCalled();
  });
  it('returns a shipping error if recalculation fails', async () => {
    vi.mocked(config.paymentDataChangedCallback).mockRejectedValue(new Error('invalid country'));
    await PCPGooglePayExpress.create(config, { selector: '#google' });
    expect(await callbacks.onPaymentDataChanged({})).toMatchObject({
      error: { intent: 'SHIPPING_ADDRESS' },
    });
  });
  it('reports user cancellation without reporting success', async () => {
    load.mockRejectedValue({ statusCode: 'CANCELED' });
    await PCPGooglePayExpress.create(config, { selector: '#google' });
    click();
    await vi.waitFor(() => expect(config.cancelCallback).toHaveBeenCalledOnce());
    expect(config.resultCallback).not.toHaveBeenCalled();
  });
  it('removes its button and prevents further sheets on destroy', async () => {
    const instance = await PCPGooglePayExpress.create(config, { selector: '#google' });
    instance.destroy();
    click();
    expect(load).not.toHaveBeenCalled();
    expect(document.querySelector('#google')!.children).toHaveLength(0);
  });
  it('suppresses late shipping and authorization errors after destroy', async () => {
    let reject!: (reason: Error) => void;
    vi.mocked(config.processPaymentCallback).mockReturnValue(
      new Promise((_resolve, fail) => {
        reject = fail;
      }),
    );
    const instance = await PCPGooglePayExpress.create(config, { selector: '#google' });
    const authorization = callbacks.onPaymentAuthorized({});
    instance.destroy();
    reject(new Error('late network failure'));
    expect(await authorization).toMatchObject({ transactionState: 'ERROR' });
    expect(await callbacks.onPaymentDataChanged({})).toMatchObject({
      error: { intent: 'SHIPPING_ADDRESS' },
    });
    expect(config.paymentDataChangedCallback).not.toHaveBeenCalled();
    expect(config.errorCallback).not.toHaveBeenCalled();
    expect(config.resultCallback).not.toHaveBeenCalled();
  });
});
