import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApplePayButton,
  ErrorType,
  PCPApplePaySession,
  PCPApplePaySessionConfig,
} from '../index.js';

describe('PCPApplePaySession', () => {
  let document: Document;
  let window;

  beforeEach(() => {
    const { window: jsdomWindow } = new JSDOM(
      '<!DOCTYPE html><head></head><body></body>',
      {
        url: 'http://localhost',
      },
    );
    document = jsdomWindow.document;
    window = jsdomWindow as unknown as Window & typeof globalThis;
    global.document = document;
    global.window = window;

    const selector = document.createElement('div');
    selector.id = 'mock-button-selector';
    document.body.appendChild(selector);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const errorCallbackMockFn = vi.fn();
  const paymentMethodSelectedCallbackMockFn = vi.fn();
  const couponCodeChangedCallbackMockFn = vi.fn();
  const shippingMethodSelectedCallbackMockFn = vi.fn();
  const shippingContactAddressSelectedCallbackMockFn = vi.fn();
  const cancelCallbackMockFn = vi.fn();

  const mockApplePaySessionConfig: PCPApplePaySessionConfig = {
    applePayVersion: 3,
    countryCode: 'DE',
    currencyCode: 'EUR',
    merchantCapabilities: [
      'supports3DS', // mandatory
    ],
    supportedNetworks: ['visa', 'masterCard', 'amex', 'girocard'],
    total: {
      label: 'Demo',
      type: 'final',
      amount: '200.99',
    },
    validateMerchantURL: 'https://your-merchant-domain.de/validate-merchant',
    processPaymentURL: 'https://your-merchant-domain.de/process-payment',
    merchantValidationData: {
      merchantIdentifier: 'merchant.de.your.project',
      foo: 'bar',
    },
    paymentMethodSelectedCallback: paymentMethodSelectedCallbackMockFn,
    couponCodeChangedCallback: couponCodeChangedCallbackMockFn,
    shippingMethodSelectedCallback: shippingMethodSelectedCallbackMockFn,
    shippingContactAddressSelectedCallback:
      shippingContactAddressSelectedCallbackMockFn,
    cancelCallback: cancelCallbackMockFn,
    errorCallback: errorCallbackMockFn,
  };

  const mockApplePayButton: ApplePayButton = {
    selector: '#mock-button-selector',
    config: {
      buttonstyle: 'black',
      type: 'plain',
      locale: 'de-DE',
      style: {
        height: '42px',
        width: '100%',
        borderRadius: '10px',
        padding: '4px',
        boxSizing: 'border-box',
      },
    },
  };

  const beginSessionMockFn = vi.fn();
  const applePaySessionConstructorMockFn = vi.fn();

  describe('given a valid config', () => {
    let session: PCPApplePaySession;
    beforeEach(async () => {
      class MockApplePaySession {
        static canMakePayments() {
          return true;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(...args: any[]) {
          applePaySessionConstructorMockFn(...args);
        }
        begin = beginSessionMockFn;
        abort = vi.fn();
        onvalidatemerchant = vi.fn();
        onpaymentauthorized = vi.fn();
        onpaymentmethodselected = vi.fn();
        oncouponcodechanged = vi.fn();
        onshippingmethodselected = vi.fn();
        onshippingcontactselected = vi.fn();
        oncancel = vi.fn();

        completeMerchantValidation = vi.fn();
        completePaymentMethodSelection = vi.fn();
        completeCouponCodeChange = vi.fn();
        completeShippingMethodSelection = vi.fn();
        completeShippingContactSelection = vi.fn();
        completePayment = vi.fn();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window!.ApplePaySession = MockApplePaySession as any;
      // @ts-expect-error globalThis has no property ApplePaySession
      globalThis.ApplePaySession = MockApplePaySession;

      setTimeout(() => {
        const scriptElement = document.querySelector(
          '#apple-pay-button-script',
        );
        scriptElement!.dispatchEvent(new Event('load'));
      }, 0);
      session = await PCPApplePaySession.create(
        mockApplePaySessionConfig,
        mockApplePayButton,
      );
    });

    it('should create a new session', async () => {
      expect(session).toBeDefined();
    });

    it('should throw an error if the provided button selector is invalid', async () => {
      await expect(
        PCPApplePaySession.create(mockApplePaySessionConfig, {
          selector: '#non-existent-selector',
          config: mockApplePayButton.config,
        }),
      ).rejects.toThrow('Selector #non-existent-selector does not exist.');
    });

    describe('startApplePaySession', () => {
      beforeEach(() => {
        const applePayButton = document.querySelector('apple-pay-button');
        applePayButton!.dispatchEvent(new Event('click'));
      });

      it('should initialize a new ApplePaySession when the button is clicked', async () => {
        expect(applePaySessionConstructorMockFn).toHaveBeenCalledWith(
          3,
          mockApplePaySessionConfig,
        );
        expect(beginSessionMockFn).toHaveBeenCalled();
      });

      describe('onvalidatemerchant', () => {
        it('should handle onvalidatemerchant event', async () => {
          const fetchMockFn = vi.fn().mockReturnValue({
            ok: true,
            json: () => ({
              statusCode: 200,
              merchantSession: 'mock merchant session',
            }),
          });
          global.fetch = fetchMockFn;

          // @ts-expect-error session is not null
          session.session!.onvalidatemerchant({ validationURL: 'mock-url' });

          expect(fetchMockFn).toHaveBeenCalledWith(
            mockApplePaySessionConfig.validateMerchantURL,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                validationURL: 'mock-url',
                ...mockApplePaySessionConfig.merchantValidationData,
              }),
            },
          );
        });
        it('should invoke the errorCallback if the merchant validation fails', async () => {
          const fetchMockFn = vi.fn().mockResolvedValue({
            ok: false,
          });
          global.fetch = fetchMockFn;

          expect.hasAssertions();

          errorCallbackMockFn.mockImplementationOnce(
            (type: ErrorType, error: Error) => {
              expect(type).toEqual(ErrorType.VALIDATE_MERCHANT);
              expect(error).toBeInstanceOf(Error);
            },
          );

          // @ts-expect-error session is not null
          session.session!.onvalidatemerchant({
            validationURL: 'mock-url',
          });
        });
      });

      describe('onpaymentauthorized', () => {
        it('should handle onpaymentauthorized event', async () => {
          const fetchMockFn = vi.fn().mockReturnValue({
            ok: true,
            json: () => ({
              statusCode: 200,
              success: true,
            }),
          });
          global.fetch = fetchMockFn;
          // @ts-expect-error session is not null
          session.session!.onpaymentauthorized({ payment: 'mock-payment' });

          expect(fetchMockFn).toHaveBeenCalledWith(
            mockApplePaySessionConfig.processPaymentURL,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify('mock-payment'),
            },
          );
        });

        describe('given the payment is not successful', () => {
          beforeEach(() => {
            errorCallbackMockFn.mockImplementationOnce(
              (type: ErrorType, error: Error) => {
                expect(type).toEqual(ErrorType.PROCESS_PAYMENT);
                expect(error).toBeInstanceOf(Error);
              },
            );
          });
          it('should call the completePayment function with failure', async () => {
            const fetchMockFn = vi.fn().mockReturnValue({
              ok: true,
              json: () => ({
                statusCode: 200,
                success: false,
              }),
            });
            global.fetch = fetchMockFn;

            expect.assertions(0);

            // @ts-expect-error session is not null
            session.session!.onpaymentauthorized({ payment: 'mock-payment' });
          });
          it('should call the errorCallback if the payment fails', async () => {
            const fetchMockFn = vi.fn().mockResolvedValue({
              ok: false,
            });
            global.fetch = fetchMockFn;

            expect.hasAssertions();

            // @ts-expect-error session is not null
            session.session!.onpaymentauthorized({ payment: 'mock-payment' });
          });
        });
      });

      describe('onpaymentmethodselected', () => {
        beforeEach(() => {
          errorCallbackMockFn.mockImplementationOnce(
            (type: ErrorType, error: Error) => {
              expect(type).toEqual(ErrorType.ON_PAYMENT_METHOD_SELECTED);
              expect(error).toBeInstanceOf(Error);
            },
          );
        });
        it('should handle onpaymentmethodselected event', async () => {
          // @ts-expect-error session is not null
          session.session!.onpaymentmethodselected({ paymentMethod: 'mock' });
          expect.assertions(1);
          expect(paymentMethodSelectedCallbackMockFn).toHaveBeenCalledWith(
            'mock',
          );
        });
        it('should invoke the errorCallback if the payment method selection fails', async () => {
          paymentMethodSelectedCallbackMockFn.mockRejectedValueOnce(
            new Error(),
          );
          // @ts-expect-error session is not null
          session.session!.onpaymentmethodselected({ paymentMethod: 'mock' });
          expect.assertions(2);
        });
      });

      describe('oncouponcodechanged', () => {
        beforeEach(() => {
          errorCallbackMockFn.mockImplementationOnce(
            (type: ErrorType, error: Error) => {
              expect(type).toEqual(ErrorType.ON_COUPON_CODE_CHANGED);
              expect(error).toBeInstanceOf(Error);
            },
          );
        });
        it('should handle oncouponcodechanged event', async () => {
          // @ts-expect-error session is not null
          session.session!.oncouponcodechanged({ couponCode: 'mock' });
          expect.assertions(1);
          expect(couponCodeChangedCallbackMockFn).toHaveBeenCalledWith('mock');
        });
        it('should invoke the errorCallback if the coupon code change fails', async () => {
          couponCodeChangedCallbackMockFn.mockRejectedValueOnce(new Error());
          // @ts-expect-error session is not null
          session.session!.oncouponcodechanged({ couponCode: 'mock' });
          expect.assertions(2);
        });
      });

      describe('onshippingmethodselected', () => {
        beforeEach(() => {
          errorCallbackMockFn.mockImplementationOnce(
            (type: ErrorType, error: Error) => {
              expect(type).toEqual(ErrorType.ON_SHIPPING_METHOD_SELECTED);
              expect(error).toBeInstanceOf(Error);
            },
          );
        });
        it('should handle onshippingmethodselected event', async () => {
          // @ts-expect-error session is not null
          session.session!.onshippingmethodselected({ shippingMethod: 'mock' });
          expect.assertions(1);
          expect(shippingMethodSelectedCallbackMockFn).toHaveBeenCalledWith(
            'mock',
          );
        });
        it('should invoke the errorCallback if the shipping method selection fails', async () => {
          shippingMethodSelectedCallbackMockFn.mockRejectedValueOnce(
            new Error(),
          );
          // @ts-expect-error session is not null
          session.session!.onshippingmethodselected({ shippingMethod: 'mock' });
          expect.assertions(2);
        });
      });

      describe('onshippingcontactselected', () => {
        beforeEach(() => {
          errorCallbackMockFn.mockImplementationOnce(
            (type: ErrorType, error: Error) => {
              expect(type).toEqual(ErrorType.ON_SHIPPING_CONTACT_SELECTED);
              expect(error).toBeInstanceOf(Error);
            },
          );
        });
        it('should handle onshippingcontactselected event', async () => {
          // @ts-expect-error session is not null
          session.session!.onshippingcontactselected({
            // @ts-expect-error property does not exist on type
            shippingContact: 'mock',
          });
          expect.assertions(1);
          expect(
            shippingContactAddressSelectedCallbackMockFn,
          ).toHaveBeenCalledWith('mock');
        });
        it('should invoke the errorCallback if the shipping contact address selection fails', async () => {
          shippingContactAddressSelectedCallbackMockFn.mockRejectedValueOnce(
            new Error(),
          );
          // @ts-expect-error session is not null
          session.session!.onshippingcontactselected({
            // @ts-expect-error property does not exist on type
            shippingContact: 'mock',
          });
          expect.assertions(2);
        });
      });

      describe('oncancel', () => {
        it('should handle oncancel event', async () => {
          // @ts-expect-error session is not null
          session.session!.oncancel();
          expect(cancelCallbackMockFn).toHaveBeenCalled();
        });
      });
    });
  });

  it('should throw an error if ApplePaySession is not available in the window object', async () => {
    window!.ApplePaySession = undefined;
    // @ts-expect-error globalThis has no property ApplePaySession
    globalThis.ApplePaySession = undefined;
    await expect(
      PCPApplePaySession.create(mockApplePaySessionConfig, mockApplePayButton),
    ).rejects.toThrow('Apple Pay is not available');
  });
});
