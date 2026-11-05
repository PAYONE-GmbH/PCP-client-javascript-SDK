import {
  loadScript,
  type PayPalButtonsComponentOptions,
  type PayPalNamespace,
} from '@paypal/paypal-js';
import type { ExpressPaymentResult, PaymentMethodSpecificInput } from 'pcp-client-javascript-sdk';
import type { PayPalSdkOrder } from './backend';
import type { PayPalSdkConfig } from './config';
import { type CheckoutContact, paypalInput } from './payment';
import { quote } from './pricing';

export interface SdkCheckoutOptions extends PayPalSdkConfig {
  selector: string;
  returnUrl: string;
  createOrder: (
    input: PaymentMethodSpecificInput,
    contact: CheckoutContact,
    shipping: string,
  ) => Promise<PayPalSdkOrder>;
  completeOrder: (order: PayPalSdkOrder) => Promise<ExpressPaymentResult>;
  onResult?: (result: ExpressPaymentResult) => void;
  onCancel?: (result?: ExpressPaymentResult) => void;
  onError?: (error: Error) => void;
  buttonStyle?: PayPalButtonsComponentOptions['style'];
  loadPayPal?: typeof loadScript;
}

/** One immutable form snapshot, one PAYONE order and one completion per rendered button. */
export async function createSdkCheckout(
  options: SdkCheckoutOptions,
  contact: CheckoutContact,
  shipping: string,
) {
  quote(contact.shippingAddress.countryCode, shipping);
  const snapshot = structuredClone(contact);
  const container = document.querySelector(options.selector);
  if (!container) throw new Error('PayPal button container not found.');
  const paypal: PayPalNamespace | null = await (options.loadPayPal ?? loadScript)({
    clientId: options.clientId,
    merchantId: options.merchantId,
    currency: 'EUR',
    intent: options.intent,
    locale: options.locale,
    commit: true,
    vault: false,
    components: ['buttons'],
    disableFunding: ['card', 'sepa', 'bancontact'],
  });
  if (!paypal?.Buttons) throw new Error('PayPal SDK could not be loaded.');
  let destroyed = false;
  let order: Promise<PayPalSdkOrder> | undefined;
  let completion: Promise<ExpressPaymentResult> | undefined;
  let outcome: 'approve' | 'cancel' | 'error' | undefined;
  const report = (error: unknown) => {
    if (destroyed) return;
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : String(error);
    options.onError?.(error instanceof Error ? error : new Error(message));
  };
  const finalize = async (kind: 'approve' | 'cancel' | 'error', orderID?: string) => {
    if (destroyed || !order) return;
    const saved = await order;
    if (orderID && saved.orderId !== orderID) throw new Error('PayPal callback orderID mismatch.');
    if (destroyed || outcome) return;
    outcome = kind;
    completion ??= Promise.resolve().then(() => options.completeOrder(saved));
    const result = await completion;
    if (destroyed) return;
    if (kind === 'cancel') options.onCancel?.(result);
    else options.onResult?.(result);
  };
  const buttons = paypal.Buttons({
    fundingSource: paypal.FUNDING?.PAYPAL,
    style: options.buttonStyle ?? {
      layout: 'vertical',
      color: 'gold',
      shape: 'rect',
      label: 'paypal',
    },
    createOrder: () => {
      if (destroyed || outcome)
        return Promise.reject(
          new Error('This PayPal attempt is closed. Reconcile before retrying.'),
        );
      order ??= Promise.resolve().then(() => {
        if (destroyed) throw new Error('PayPal checkout destroyed.');
        const input = paypalInput(options.returnUrl);
        input.redirectPaymentMethodSpecificInput!.requiresApproval = options.intent === 'authorize';
        input.redirectPaymentMethodSpecificInput!
          .paymentProduct840SpecificInput!.javaScriptSdkFlow = true;
        return options.createOrder(input, snapshot, shipping);
      });
      return order.then((saved) => saved.orderId);
    },
    onApprove: (data) =>
      finalize('approve', data.orderID).catch((error) => {
        report(error);
        throw error;
      }),
    onCancel: async (data) => {
      if (!order && !destroyed) options.onCancel?.();
      else
        await finalize('cancel', typeof data.orderID === 'string' ? data.orderID : undefined).catch(
          report,
        );
    },
    onError: (error) => {
      report(error);
      // A known order also needs status propagation after cancel/error. No fresh order or POST retry.
      void finalize('error').catch(report);
    },
  });
  if (!buttons.isEligible())
    throw new Error('PayPal is not eligible in this browser/configuration.');
  try {
    await buttons.render(container as HTMLElement);
  } catch (error) {
    destroyed = true;
    await buttons.close();
    throw error;
  }
  return {
    destroy: async () => {
      destroyed = true;
      await buttons.close();
    },
  };
}
