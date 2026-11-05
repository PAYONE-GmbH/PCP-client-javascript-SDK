import type {
  Address,
  AddressPersonal,
  AmountOfMoney,
  PaymentReferences,
  RedirectionData,
  ShoppingCartInput,
} from './index.js';

/** Commerce Platform API 1.71.0: PayPal redirect PaymentIntent subset used by Express. */
export interface PaymentIntentRequest {
  amountOfMoney: AmountOfMoney;
  references: PaymentReferences;
  shoppingCart?: ShoppingCartInput;
  paymentMethodSpecificInput: {
    redirectPaymentMethodSpecificInput: {
      paymentProductId: 840;
      requiresApproval: boolean;
      redirectionData: RedirectionData;
      paymentProduct840SpecificInput: {
        addressSelectionAtPayPal: boolean;
        javaScriptSdkFlow: false;
      };
    };
  };
}

export interface PaymentIntentResponse {
  paymentIntentId?: string;
  paymentId?: string;
  amountOfMoney?: AmountOfMoney;
  references?: PaymentReferences;
  redirectPaymentMethodSpecificOutput?: {
    paymentProductId?: number;
    redirectData?: { redirectURL?: string };
    paymentProduct840SpecificOutput?: {
      billingAddress?: Address;
      shippingAddress?: AddressPersonal & { companyName?: string };
      customerAccount?: {
        firstName?: string;
        surname?: string;
        companyName?: string;
        emailAddress?: string;
      };
      payPalTransactionId?: string;
    };
  };
}

/** POST wraps the output; GET /payment-intents/{id} returns PaymentIntentResponse directly. */
export interface CreatePaymentIntentResponse {
  paymentIntentOutput?: PaymentIntentResponse;
}
