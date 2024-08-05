import {
  ApplePayButton,
  ErrorType,
  PCPApplePaySessionConfig,
} from '../interfaces/index.js';

declare global {
  interface Window {
    ApplePaySession: typeof ApplePaySession;
  }
}

export class PCPApplePaySession {
  private config?: PCPApplePaySessionConfig;
  private session: ApplePaySession | null = null;

  /**
   * Creates a new Apple Pay session, displays the Apple Pay button.
   * @param {PCPApplePaySessionConfig} config
   * @param {ApplePayButton} button
   * @returns {Promise<PCPApplePaySession>} A new instance of the PCPApplePaySession
   */
  public static async create(
    config: PCPApplePaySessionConfig,
    button: ApplePayButton,
  ): Promise<PCPApplePaySession> {
    const instance = new PCPApplePaySession(config);
    await instance.initialize(button);
    return instance;
  }

  private constructor(config: PCPApplePaySessionConfig) {
    this.config = config;
  }

  private checkForRequiredElements(button: ApplePayButton) {
    if (!window.ApplePaySession || !ApplePaySession.canMakePayments()) {
      throw new Error('Apple Pay is not available.');
    }

    if (!document.querySelector(button.selector)) {
      throw new Error(`Button Selector ${button.selector} does not exist.`);
    }
  }

  private async initialize(button: ApplePayButton) {
    this.checkForRequiredElements(button);
    await this.loadApplePayButtonScript();
    await this.displayApplePayButton(button);
  }

  private async startApplePaySession() {
    this.session = new window.ApplePaySession(
      this.config!.applePayVersion,
      this.config!,
    );

    const validateSession = () => {
      if (!this.session) {
        throw new Error('Apple Pay session is not available.');
      }
    };

    this.session.onvalidatemerchant = (event) => {
      (async () => {
        validateSession();
        const validationURL = event.validationURL;
        try {
          const merchantSession = await this.validateMerchant(validationURL);
          this.session!.completeMerchantValidation(merchantSession);
        } catch (error) {
          this.session!.abort();
          this.config!.errorCallback?.(
            ErrorType.VALIDATE_MERCHANT,
            error as Error,
          );
        }
      })();
    };

    this.session.onpaymentauthorized = (event) => {
      (async () => {
        validateSession();
        const payment = event.payment;
        try {
          const success = await this.processPayment(payment);
          this.session!.completePayment(
            success
              ? ApplePaySession.STATUS_SUCCESS
              : ApplePaySession.STATUS_FAILURE,
          );
        } catch (error) {
          this.session!.completePayment(ApplePaySession.STATUS_FAILURE);
          this.config!.errorCallback?.(
            ErrorType.PROCESS_PAYMENT,
            error as Error,
          );
        }
      })();
    };

    if (this.config?.paymentMethodSelectedCallback !== undefined) {
      this.session.onpaymentmethodselected = (event) => {
        (async () => {
          validateSession();
          const paymentMethod = event.paymentMethod;
          try {
            const paymentMethodUpdate =
              await this.config!.paymentMethodSelectedCallback!(paymentMethod);
            this.session!.completePaymentMethodSelection(paymentMethodUpdate);
          } catch (error) {
            this.session!.abort();
            this.config!.errorCallback?.(
              ErrorType.ON_PAYMENT_METHOD_SELECTED,
              error as Error,
            );
          }
        })();
      };
    }

    if (this.config?.couponCodeChangedCallback !== undefined) {
      this.session.oncouponcodechanged = (event) => {
        (async () => {
          validateSession();
          const couponCode = event.couponCode;
          try {
            const couponCodeUpdate =
              await this.config!.couponCodeChangedCallback!(couponCode);
            this.session!.completeCouponCodeChange(couponCodeUpdate);
          } catch (error) {
            this.session!.abort();
            this.config!.errorCallback?.(
              ErrorType.ON_COUPON_CODE_CHANGED,
              error as Error,
            );
          }
        })();
      };
    }

    if (this.config?.shippingMethodSelectedCallback !== undefined) {
      this.session.onshippingmethodselected = (event) => {
        (async () => {
          validateSession();
          const shippingMethod = event.shippingMethod;
          try {
            const shippingMethodUpdate =
              await this.config!.shippingMethodSelectedCallback!(
                shippingMethod,
              );
            this.session!.completeShippingMethodSelection(shippingMethodUpdate);
          } catch (error) {
            this.session!.abort();
            this.config!.errorCallback?.(
              ErrorType.ON_SHIPPING_METHOD_SELECTED,
              error as Error,
            );
          }
        })();
      };
    }

    if (this.config?.shippingContactAddressSelectedCallback !== undefined) {
      this.session.onshippingcontactselected = (event) => {
        (async () => {
          validateSession();
          const shippingContact = event.shippingContact;
          try {
            const shippingContactUpdate =
              await this.config!.shippingContactAddressSelectedCallback!(
                shippingContact,
              );
            this.session!.completeShippingContactSelection(
              shippingContactUpdate,
            );
          } catch (error) {
            this.session!.abort();
            this.config!.errorCallback?.(
              ErrorType.ON_SHIPPING_CONTACT_SELECTED,
              error as Error,
            );
          }
        })();
      };
    }

    if (this.config?.cancelCallback !== undefined) {
      this.session.oncancel = () => {
        this.config!.cancelCallback!();
      };
    }

    this.session.begin();
  }

  private async validateMerchant(validationURL: string): Promise<unknown> {
    // Send validationURL to merchant server for validation
    const response = await fetch(this.config!.validateMerchantURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        validationURL,
        merchantIdentifier: this.config!.merchantIdentifier,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to validate merchant');
    }

    const body = await response.json();
    if (body.statusCode === '400') {
      throw new Error('Failed to validate merchant');
    }
    return body;
  }

  private async processPayment(
    payment: ApplePayJS.ApplePayPayment,
  ): Promise<boolean> {
    // Send payment to merchant server for processing
    const response = await fetch(this.config!.processPaymentURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payment),
    });

    if (!response.ok) {
      throw new Error('Failed to process payment');
    }

    const result = await response.json();
    return result.success;
  }

  private async loadApplePayButtonScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById('apple-pay-button-script')) {
        resolve(); // Script already loaded
        return;
      }

      const script = document.createElement('script');
      script.id = 'apple-pay-button-script';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src =
        'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js';
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Failed to load the Apple Pay button script.'));
      document.body.appendChild(script);
    });
  }

  private async displayApplePayButton(button: ApplePayButton) {
    const applePayButton = document.createElement('apple-pay-button');

    applePayButton.setAttribute('buttonstyle', button.config.buttonstyle);
    applePayButton.setAttribute('type', button.config.type);
    applePayButton.setAttribute('locale', button.config.locale);

    applePayButton.style.width = button.config.style?.width || 'auto';
    applePayButton.style.height = button.config.style?.height || '30px';
    applePayButton.style.borderRadius =
      button.config.style?.borderRadius || '3px';
    applePayButton.style.padding = button.config.style?.padding || '0';
    applePayButton.style.boxSizing =
      button.config.style?.boxSizing || 'border-box';

    applePayButton.onclick = async () => {
      await this.startApplePaySession();
    };

    document.querySelector(button.selector)!.appendChild(applePayButton);
  }
}
