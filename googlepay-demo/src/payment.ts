import {
  AuthorizationMode,
  type AddressPersonal,
  type Customer,
  type MobilePaymentMethodSpecificInput,
} from 'pcp-client-javascript-sdk';

export function googleContact(contact: google.payments.api.Address): AddressPersonal {
  const words = (contact.name ?? '').trim().split(/\s+/);
  // PAYONE's optional state accepts a short code, not an empty value or a region name.
  const state = contact.administrativeArea?.trim();
  return {
    countryCode: contact.countryCode,
    city: contact.locality,
    zip: contact.postalCode,
    ...(state && /^[a-zA-Z0-9]{1,3}$/.test(state) ? { state } : {}),
    street: contact.address1,
    additionalInfo: [contact.address2, contact.address3].filter(Boolean).join(', '),
    name: { firstName: words.slice(0, -1).join(' '), surname: words[words.length - 1] },
  };
}

export function googleCustomer(payment: google.payments.api.PaymentData): Customer {
  const billing = payment.paymentMethodData.info?.billingAddress;
  const shipping = payment.shippingAddress;
  if (!billing || !shipping || !payment.email) throw new Error('Missing final customer details.');
  const { name, ...billingAddress } = googleContact(billing);
  return {
    billingAddress,
    personalInformation: { name },
    contactDetails: {
      emailAddress: payment.email,
      phoneNumber: billing.phoneNumber || shipping.phoneNumber,
    },
  };
}

/** Encode the original token string as UTF-8 Base64 exactly once. */
export function googleInput(
  payment: google.payments.api.PaymentData,
  returnUrl: string,
): MobilePaymentMethodSpecificInput {
  const token = payment.paymentMethodData.tokenizationData.token;
  if (typeof token !== 'string' || !token) throw new Error('Missing Google Pay token.');
  const encoded = btoa(
    Array.from(new TextEncoder().encode(token), (byte) => String.fromCharCode(byte)).join(''),
  );
  return {
    paymentProductId: 320,
    authorizationMode: AuthorizationMode.SALE,
    encryptedPaymentData: encoded,
    threeDSecure: { redirectionData: { returnUrl } },
  };
}
