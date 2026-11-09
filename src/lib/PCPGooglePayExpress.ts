import type {
  GooglePayButton,
  PCPGooglePayExpressConfig,
} from '../interfaces/PCPGooglePayExpress.interfaces.js';
import type { ExpressPaymentResult } from '../interfaces/PCPExpressCheckout.interfaces.js';
import { loadWalletScript } from './loadWalletScript.js';

/** Google Pay Express with shipping callbacks and backend-authoritative authorization. */
export class PCPGooglePayExpress {
  private client!: google.payments.api.PaymentsClient;
  private button?: HTMLElement;
  private active = false;
  private destroyed = false;
  private authorization?: Promise<google.payments.api.PaymentAuthorizationResult>;
  private result?: ExpressPaymentResult;

  private constructor(private readonly config: PCPGooglePayExpressConfig) {}

  public static async create(
    config: PCPGooglePayExpressConfig,
    button: GooglePayButton,
  ): Promise<PCPGooglePayExpress> {
    const container = document.querySelector(button.selector);
    if (!container) { throw new Error(`Button Selector ${button.selector} does not exist.`); }
    const intents = config.paymentRequest.callbackIntents ?? [];
    if (
      !intents.includes('PAYMENT_AUTHORIZATION') ||
      !intents.includes('SHIPPING_ADDRESS') ||
      !config.paymentRequest.shippingAddressRequired
    ) {
      throw new Error(
        'Express requires PAYMENT_AUTHORIZATION, SHIPPING_ADDRESS and shippingAddressRequired.',
      );
    }
    if (!globalThis.google?.payments?.api?.PaymentsClient) {
      await loadWalletScript('google-pay-sdk', 'https://pay.google.com/gp/p/js/pay.js');
    }
    const instance = new PCPGooglePayExpress(config);
    instance.client = new google.payments.api.PaymentsClient({
      environment: config.environment,
      paymentDataCallbacks: {
        onPaymentDataChanged: async (data) => {
          try {
            if (instance.destroyed) { throw new Error('Google Pay instance was destroyed.'); }
            const update = await config.paymentDataChangedCallback(data);
            if (instance.destroyed) { throw new Error('Google Pay instance was destroyed.'); }
            return update;
          } catch (error) {
            if (!instance.destroyed) { config.errorCallback?.(error as Error); }
            return {
              error: {
                reason: 'OTHER_ERROR',
                intent: 'SHIPPING_ADDRESS',
                message: 'Unable to update shipping.',
              },
            };
          }
        },
        onPaymentAuthorized: (data) => {
          instance.authorization ??= instance.authorize(data);
          const current = instance.authorization;
          void current.then((result) => {
            // Allow corrected validation/card after ERROR; the merchant guards submitted orders.
            if (result.transactionState === 'ERROR' && instance.authorization === current) {
              instance.authorization = undefined;
            }
          });
          return current;
        },
      },
    });
    const ready = await instance.client.isReadyToPay({
      apiVersion: config.paymentRequest.apiVersion,
      apiVersionMinor: config.paymentRequest.apiVersionMinor,
      allowedPaymentMethods: config.paymentRequest.allowedPaymentMethods,
    });
    if (!ready.result) { throw new Error('Google Pay is not available.'); }
    instance.button = instance.client.createButton({
      ...config.buttonOptions,
      onClick: () => {
        void instance.start();
      },
    });
    container.appendChild(instance.button);
    return instance;
  }

  private async authorize(
    data: google.payments.api.PaymentData,
  ): Promise<google.payments.api.PaymentAuthorizationResult> {
    try {
      if (this.destroyed) { throw new Error('Google Pay instance was destroyed.'); }
      this.result = undefined;
      this.result = await this.config.processPaymentCallback(data);
      if (this.result.status === 'failed') {
        return {
          transactionState: 'ERROR',
          error: {
            intent: 'PAYMENT_AUTHORIZATION',
            reason: 'OTHER_ERROR',
            message: this.result.message,
          },
        };
      }
      return { transactionState: 'SUCCESS' };
    } catch (error) {
      if (!this.destroyed) { this.config.errorCallback?.(error as Error); }
      return {
        transactionState: 'ERROR',
        error: {
          intent: 'PAYMENT_AUTHORIZATION',
          reason: 'OTHER_ERROR',
          message: 'Payment could not be processed.',
        },
      };
    }
  }

  private async start(): Promise<void> {
    if (this.active || this.destroyed) { return; }
    this.active = true;
    this.authorization = undefined;
    this.result = undefined;
    try {
      await this.client.loadPaymentData(this.config.paymentRequest);
      if (!this.destroyed && this.result) { this.config.resultCallback?.(this.result); }
    } catch (error) {
      if (this.destroyed) { return; }
      if ((error as { statusCode?: string }).statusCode === 'CANCELED') {
        this.config.cancelCallback?.();
      }
      else { this.config.errorCallback?.(error as Error); }
    } finally {
      this.active = false;
    }
  }

  public destroy(): void {
    this.destroyed = true;
    this.button?.remove();
  }
}
