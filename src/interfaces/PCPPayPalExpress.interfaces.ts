import type { ExpressCallbacks, ExpressPaymentResult } from './PCPExpressCheckout.interfaces.js';

/** Transient correlation IDs, phase and optional outcome; do not persist fetched contacts. */
export interface PayPalExpressContext {
  paymentIntentId: string;
  paymentId: string;
  phase: 'redirected' | 'review' | 'confirming' | 'submitted';
  result?: ExpressPaymentResult;
}

export interface PCPPayPalExpressConfig<TIntent> extends ExpressCallbacks {
  createIntent: () => Promise<{ paymentIntentId: string; paymentId: string; redirectUrl: string }>;
  loadIntent: (context: PayPalExpressContext) => Promise<TIntent>;
  confirmPayment: (intent: TIntent, context: PayPalExpressContext) => Promise<ExpressPaymentResult>;
  /** Called before navigation / order submission. Persist synchronously (e.g. sessionStorage). */
  contextChangedCallback: (context: PayPalExpressContext | null) => void;
  navigate?: (url: string) => void;
}
