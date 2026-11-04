import {
  type ApplePayButton,
  ErrorType,
  type PCPApplePaySessionConfig,
} from '../interfaces/index.js';
import { loadWalletScript } from './loadWalletScript.js';

declare global {
  interface Window {
    ApplePaySession: typeof ApplePaySession;
  }
}

export class PCPApplePaySession {
  private config?: PCPApplePaySessionConfig;
  private session: ApplePaySession | null = null;
  private button?: HTMLElement;
  private destroyed = false;
  private active = false;

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
    if (this.config?.processPaymentCallback && this.config?.processPaymentURL) {
      throw new Error('Provide only one of processPaymentCallback and processPaymentURL.');
    }
    if (!this.config?.processPaymentCallback && !this.config?.processPaymentURL) {
      throw new Error('Provide processPaymentCallback or processPaymentURL.');
    }
    await this.loadApplePayButtonScript();
    this.checkForRequiredElements(button);
    await this.displayApplePayButton(button);
  }

  private async startApplePaySession() {
    if (this.destroyed || this.active) return;
    // The cross-browser SDK sends this request through postMessage. Keep wrapper
    // callbacks and endpoint configuration out of that structured-clone payload.
    const {
      applePayVersion,
      validateMerchantURL: _validateMerchantURL,
      processPaymentURL: _processPaymentURL,
      processPaymentCallback: _processPaymentCallback,
      resultCallback: _resultCallback,
      applePayButtonId: _applePayButtonId,
      paymentMethodSelectedCallback: _paymentMethodSelectedCallback,
      couponCodeChangedCallback: _couponCodeChangedCallback,
      shippingMethodSelectedCallback: _shippingMethodSelectedCallback,
      shippingContactAddressSelectedCallback: _shippingContactAddressSelectedCallback,
      cancelCallback: _cancelCallback,
      errorCallback: _errorCallback,
      ...paymentRequest
    } = this.config!;
    this.session = new window.ApplePaySession(applePayVersion, paymentRequest);
    this.active = true;
    const current = this.session;

    const isCurrent = () => !this.destroyed && this.session === current && this.active;
    let processing = false;

    this.session.onvalidatemerchant = (event) => {
      (async () => {
        if (!isCurrent()) return;
        const validationURL = event.validationURL;
        try {
          const merchantSession = await this.validateMerchant(validationURL);
          if (!isCurrent()) return;
          this.session!.completeMerchantValidation(merchantSession);
        } catch (error) {
          if (!isCurrent()) return;
          this.session!.abort();
          this.active = false;
          this.config!.errorCallback?.(ErrorType.VALIDATE_MERCHANT, error as Error);
        }
      })();
    };

    this.session.onpaymentauthorized = (event) => {
      (async () => {
        if (!isCurrent() || processing) return;
        processing = true;
        const payment = event.payment;
        try {
          const result = this.config!.processPaymentCallback
            ? await this.config!.processPaymentCallback(payment)
            : undefined;
          const success = result ? result.status !== 'failed' : await this.processPayment(payment);
          if (!isCurrent()) return;
          this.session!.completePayment(
            success ? ApplePaySession.STATUS_SUCCESS : ApplePaySession.STATUS_FAILURE,
          );
          this.active = false;
          if (result) this.config!.resultCallback?.(result);
        } catch (error) {
          if (!isCurrent()) return;
          this.session!.completePayment(ApplePaySession.STATUS_FAILURE);
          this.active = false;
          this.config!.errorCallback?.(ErrorType.PROCESS_PAYMENT, error as Error);
        }
      })();
    };

    if (this.config?.paymentMethodSelectedCallback !== undefined) {
      this.session.onpaymentmethodselected = (event) => {
        (async () => {
          if (!isCurrent()) return;
          const paymentMethod = event.paymentMethod;
          try {
            const paymentMethodUpdate =
              await this.config!.paymentMethodSelectedCallback!(paymentMethod);
            if (!isCurrent()) return;
            this.session!.completePaymentMethodSelection(paymentMethodUpdate);
          } catch (error) {
            if (!isCurrent()) return;
            this.session!.abort();
            this.active = false;
            this.config!.errorCallback?.(ErrorType.ON_PAYMENT_METHOD_SELECTED, error as Error);
          }
        })();
      };
    }

    if (this.config?.couponCodeChangedCallback !== undefined) {
      this.session.oncouponcodechanged = (event) => {
        (async () => {
          if (!isCurrent()) return;
          const couponCode = event.couponCode;
          try {
            const couponCodeUpdate = await this.config!.couponCodeChangedCallback!(couponCode);
            if (!isCurrent()) return;
            this.session!.completeCouponCodeChange(couponCodeUpdate);
          } catch (error) {
            if (!isCurrent()) return;
            this.session!.abort();
            this.active = false;
            this.config!.errorCallback?.(ErrorType.ON_COUPON_CODE_CHANGED, error as Error);
          }
        })();
      };
    }

    if (this.config?.shippingMethodSelectedCallback !== undefined) {
      this.session.onshippingmethodselected = (event) => {
        (async () => {
          if (!isCurrent()) return;
          const shippingMethod = event.shippingMethod;
          try {
            const shippingMethodUpdate =
              await this.config!.shippingMethodSelectedCallback!(shippingMethod);
            if (!isCurrent()) return;
            this.session!.completeShippingMethodSelection(shippingMethodUpdate);
          } catch (error) {
            if (!isCurrent()) return;
            this.session!.abort();
            this.active = false;
            this.config!.errorCallback?.(ErrorType.ON_SHIPPING_METHOD_SELECTED, error as Error);
          }
        })();
      };
    }

    if (this.config?.shippingContactAddressSelectedCallback !== undefined) {
      this.session.onshippingcontactselected = (event) => {
        (async () => {
          if (!isCurrent()) return;
          const shippingContact = event.shippingContact;
          try {
            const shippingContactUpdate =
              await this.config!.shippingContactAddressSelectedCallback!(shippingContact);
            if (!isCurrent()) return;
            this.session!.completeShippingContactSelection(shippingContactUpdate);
          } catch (error) {
            if (!isCurrent()) return;
            this.session!.abort();
            this.active = false;
            this.config!.errorCallback?.(ErrorType.ON_SHIPPING_CONTACT_SELECTED, error as Error);
          }
        })();
      };
    }

    this.session.oncancel = () => {
      if (!isCurrent()) return;
      this.active = false;
      this.config!.cancelCallback?.();
    };

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

  private async processPayment(payment: ApplePayJS.ApplePayPayment): Promise<boolean> {
    // Send payment to merchant server for processing
    const response = await fetch(this.config!.processPaymentURL!, {
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
    // An application may already have evaluated the official SDK before creating this adapter.
    // The native Safari ApplePaySession global alone is not evidence that the web SDK was loaded.
    if (window.ApplePaySession && customElements.get('apple-pay-button')) return;
    return loadWalletScript(
      this.config?.applePayButtonId || 'apple-pay-button-script',
      'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js',
    );
  }

  /** Removes this instance's button and aborts an open sheet. Does not unload the shared script. */
  public destroy(): void {
    this.destroyed = true;
    if (this.active) this.session?.abort();
    this.active = false;
    this.session = null;
    this.button?.remove();
  }

  private async displayApplePayButton(button: ApplePayButton) {
    const applePayButton = document.createElement('apple-pay-button');
    this.button = applePayButton;

    applePayButton.setAttribute('buttonstyle', button.config.buttonstyle);
    applePayButton.setAttribute('type', button.config.type);
    applePayButton.setAttribute('locale', button.config.locale);

    applePayButton.style.width = button.config.style?.width || 'auto';
    applePayButton.style.height = button.config.style?.height || '30px';
    applePayButton.style.borderRadius = button.config.style?.borderRadius || '3px';
    applePayButton.style.padding = button.config.style?.padding || '0';
    applePayButton.style.boxSizing = button.config.style?.boxSizing || 'border-box';

    applePayButton.onclick = async () => {
      try {
        await this.startApplePaySession();
      } catch (error) {
        this.active = false;
        this.config!.errorCallback?.(ErrorType.PROCESS_PAYMENT, error as Error);
      }
    };

    document.querySelector(button.selector)!.appendChild(applePayButton);
  }
}
