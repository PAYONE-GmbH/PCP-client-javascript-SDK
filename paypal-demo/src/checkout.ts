import {
  PCPPayPalExpress,
  type ExpressPaymentResult,
  type PayPalExpressContext,
  type PaymentIntentResponse,
} from 'pcp-client-javascript-sdk';
import { type CheckoutContact, paypalInput } from './payment';
import { quote } from './pricing';

export interface PayPalCheckoutOptions {
  returnUrl: string;
  submit: (
    input: ReturnType<typeof paypalInput>,
    contact: CheckoutContact,
    shippingOptionId: string,
  ) => Promise<ExpressPaymentResult>;
  onResult?: (result: ExpressPaymentResult) => void;
}

/** One immutable merchant-checkout snapshot and at most one POST per handle. */
export function createStandardCheckout(
  options: PayPalCheckoutOptions,
  contact: CheckoutContact,
  shippingOptionId: string,
) {
  quote(contact.shippingAddress.countryCode, shippingOptionId);
  const snapshot = structuredClone(contact);
  let submission: Promise<ExpressPaymentResult> | undefined;
  return {
    pay: () => {
      submission ??= Promise.resolve()
        .then(() => options.submit(paypalInput(options.returnUrl), snapshot, shippingOptionId))
        .then((result) => {
          options.onResult?.(result);
          return result;
        });
      return submission;
    },
  };
}

export interface PayPalExpressOptions extends PayPalCheckoutOptions {
  createIntent: () => Promise<{ paymentIntentId: string; paymentId: string; redirectUrl: string }>;
  loadIntent: (paymentIntentId: string) => Promise<PaymentIntentResponse>;
  persist: (context: PayPalExpressContext | null) => void;
  /** Read the explicitly reviewed shipping address and option only when confirming. */
  review: () => { shippingAddress: CheckoutContact['shippingAddress']; shippingOptionId: string };
  onCancel?: () => void;
  onError?: (error: Error) => void;
  navigate?: (url: string) => void;
}

export function createExpressCheckout(options: PayPalExpressOptions) {
  return PCPPayPalExpress.create<PaymentIntentResponse>({
    createIntent: options.createIntent,
    loadIntent: async (context) => {
      const intent = await options.loadIntent(context.paymentIntentId);
      if (
        intent.paymentIntentId !== context.paymentIntentId ||
        intent.paymentId !== context.paymentId
      )
        throw new Error('PaymentIntent correlation mismatch. Do not submit an order.');
      const output = intent.redirectPaymentMethodSpecificOutput;
      if (
        output?.paymentProductId !== 840 ||
        !output.paymentProduct840SpecificOutput?.shippingAddress
      )
        throw new Error('No PayPal shipping address received. Do not submit an order.');
      return intent;
    },
    confirmPayment: (intent, context) => {
      const output = intent.redirectPaymentMethodSpecificOutput!.paymentProduct840SpecificOutput!;
      const { shippingAddress, shippingOptionId } = options.review();
      quote(shippingAddress.countryCode, shippingOptionId);
      return options.submit(
        paypalInput(options.returnUrl, context.paymentId),
        {
          customer: {
            billingAddress: output.billingAddress,
            personalInformation: {
              name: {
                firstName: output.customerAccount?.firstName,
                surname: output.customerAccount?.surname,
              },
            },
            contactDetails: { emailAddress: output.customerAccount?.emailAddress },
          },
          shippingAddress: structuredClone(shippingAddress),
        },
        shippingOptionId,
      );
    },
    contextChangedCallback: options.persist,
    resultCallback: options.onResult,
    cancelCallback: options.onCancel,
    errorCallback: options.onError,
    navigate: options.navigate,
  });
}
