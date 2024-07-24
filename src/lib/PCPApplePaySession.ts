import {
  ApplePayButton,
  PCPApplePaySessionConfig,
} from '../interfaces/index.js';

declare global {
  interface Window {
    ApplePaySession: typeof ApplePaySession;
  }
}

export class PCPApplePaySession {
  private config?: PCPApplePaySessionConfig;

  constructor(config: PCPApplePaySessionConfig, button: ApplePayButton) {
    if (!window.ApplePaySession || !ApplePaySession.canMakePayments()) {
      throw new Error('Apple Pay is not available.');
    }

    if (!button.selector) {
      throw new Error('Button Selector is required.');
    }

    this.config = config;
    this.initialize(button);
  }

  private async initialize(button: ApplePayButton) {
    // check if buttonSelector exists
    const selector = document.querySelector(button.selector);
    if (!selector) {
      throw new Error(`Selector ${button.selector} does not exist.`);
    }
    await this.loadApplePayButtonScript();
    await this.displayApplePayButton(button, selector);
  }

  private async startApplePaySession() {
    const session = new window.ApplePaySession(3, this.config!);

    session.onvalidatemerchant = async (event) => {
      const validationURL = event.validationURL;
      try {
        const merchantSession = await this.validateMerchant(validationURL);
        session.completeMerchantValidation(merchantSession);
      } catch (error) {
        session.abort();
        throw error;
      }
    };

    session.onpaymentauthorized = async (event) => {
      const payment = event.payment;
      try {
        const success = await this.processPayment(payment);
        session.completePayment(
          success
            ? ApplePaySession.STATUS_SUCCESS
            : ApplePaySession.STATUS_FAILURE,
        );
      } catch (error) {
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        throw error;
      }
    };

    if (this.config?.paymentMethodSelectedCallback !== undefined) {
      session.onpaymentmethodselected = async (event) => {
        const paymentMethod = event.paymentMethod;
        try {
          const paymentMethodUpdate =
            await this.config!.paymentMethodSelectedCallback!(paymentMethod);
          session.completePaymentMethodSelection(paymentMethodUpdate);
        } catch (error) {
          session.abort();
          throw error;
        }
      };
    }

    if (this.config?.couponCodeChangedCallback !== undefined) {
      session.oncouponcodechanged = async (event) => {
        const couponCode = event.couponCode;
        try {
          const couponCodeUpdate =
            await this.config!.couponCodeChangedCallback!(couponCode);
          session.completeCouponCodeChange(couponCodeUpdate);
        } catch (error) {
          session.abort();
          throw error;
        }
      };
    }

    if (this.config?.shippingMethodSelectedCallback !== undefined) {
      session.onshippingmethodselected = async (event) => {
        const shippingMethod = event.shippingMethod;
        try {
          const shippingMethodUpdate =
            await this.config!.shippingMethodSelectedCallback!(shippingMethod);
          session.completeShippingMethodSelection(shippingMethodUpdate);
        } catch (error) {
          session.abort();
          throw error;
        }
      };
    }

    if (this.config?.shippingContactAddressSelectedCallback !== undefined) {
      session.onshippingcontactselected = async (event) => {
        const shippingContact = event.shippingContact;
        try {
          const shippingContactUpdate =
            await this.config!.shippingContactAddressSelectedCallback!(
              shippingContact,
            );
          session.completeShippingContactSelection(shippingContactUpdate);
        } catch (error) {
          session.abort();
          throw error;
        }
      };
    }

    if (this.config?.cancelCallback !== undefined) {
      session.oncancel = () => {
        this.config!.cancelCallback!();
      };
    }

    session.begin();
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
        ...this.config!.merchantValidationData,
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
        reject(); // Script already loaded
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

  private async displayApplePayButton(
    button: ApplePayButton,
    selector: Element,
  ) {
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

    selector.appendChild(applePayButton);
  }
}
