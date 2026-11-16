/// <reference types="googlepay" preserve="true" />

import type { ExpressCallbacks, ExpressPaymentResult } from './PCPExpressCheckout.interfaces.js';

export interface PCPGooglePayExpressConfig extends ExpressCallbacks {
  environment: google.payments.api.Environment;
  paymentRequest: google.payments.api.PaymentDataRequest;
  /** Recalculate using the redacted address / selected shipping option, without submitting an order. */
  paymentDataChangedCallback: (
    data: google.payments.api.IntermediatePaymentData,
  ) => Promise<google.payments.api.PaymentDataRequestUpdate>;
  /** Submit final contacts/token within 30 seconds. ERROR allows another callback; guard orders in your backend. */
  processPaymentCallback: (data: google.payments.api.PaymentData) => Promise<ExpressPaymentResult>;
  buttonOptions?: Omit<google.payments.api.ButtonOptions, 'onClick'>;
}

export interface GooglePayButton {
  selector: string;
}
