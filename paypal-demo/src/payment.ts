import type {
  AddressPersonal,
  Customer,
  PaymentMethodSpecificInput,
} from 'pcp-client-javascript-sdk';

export interface CheckoutContact {
  customer: Customer;
  shippingAddress: AddressPersonal;
}

/** Both redirect flows use automatic capture, without vaulting or the PayPal JS SDK. */
export function paypalInput(returnUrl: string, paymentId?: string): PaymentMethodSpecificInput {
  return {
    redirectPaymentMethodSpecificInput: {
      paymentProductId: 840,
      requiresApproval: false,
      tokenize: false,
      redirectionData: { returnUrl },
      paymentProduct840SpecificInput: {
        addressSelectionAtPayPal: false,
        javaScriptSdkFlow: false,
        ...(paymentId ? { paymentId } : {}),
      },
    },
  };
}

export function formContact(form: HTMLFormElement): CheckoutContact {
  const data = new FormData(form);
  const value = (name: string) => String(data.get(name) ?? '').trim();
  const name = { firstName: value('firstName'), surname: value('surname') };
  const address = {
    street: value('street'),
    zip: value('zip'),
    city: value('city'),
    countryCode: 'DE',
    ...(value('additionalInfo') ? { additionalInfo: value('additionalInfo') } : {}),
  };
  return {
    customer: {
      personalInformation: { name },
      contactDetails: { emailAddress: value('email') },
      billingAddress: { ...address },
    },
    shippingAddress: { ...address, name },
  };
}
