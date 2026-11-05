import {
  Network,
  AuthorizationMode,
  ApplePaymentTokenVersion,
  type AddressPersonal,
  type Customer,
  type MobilePaymentMethodSpecificInput,
} from 'pcp-client-javascript-sdk';

export function appleContact(contact: ApplePayJS.ApplePayPaymentContact = {}): AddressPersonal {
  return {
    countryCode: contact.countryCode?.toUpperCase(),
    city: contact.locality,
    zip: contact.postalCode,
    street: contact.addressLines?.[0],
    additionalInfo: contact.addressLines?.slice(1).join(', '),
    name: { firstName: contact.givenName, surname: contact.familyName },
  };
}

export function appleCustomer(payment: ApplePayJS.ApplePayPayment): Customer {
  return {
    billingAddress: appleContact(payment.billingContact),
    personalInformation: {
      name: appleContact(payment.billingContact ?? payment.shippingContact).name,
    },
    contactDetails: {
      emailAddress: payment.shippingContact?.emailAddress,
      phoneNumber: payment.shippingContact?.phoneNumber,
    },
  };
}

/** Apple encrypted fields are already Base64. Preserve them; do not encode the whole payment. */
export function appleInput(
  payment: ApplePayJS.ApplePayPayment,
  returnUrl: string,
): MobilePaymentMethodSpecificInput {
  const data = payment.token.paymentData as unknown as {
    data: string;
    signature: string;
    version: string;
    header: { publicKeyHash: string; ephemeralPublicKey: string; transactionId: string };
  };
  const networks: Record<string, Network> = {
    Visa: Network.VISA,
    MasterCard: Network.MASTERCARD,
    Mastercard: Network.MASTERCARD,
    girocard: Network.GIROCARD,
    Girocard: Network.GIROCARD,
  };
  const network = networks[payment.token.paymentMethod.network ?? ''];
  if (
    !network ||
    !data.data ||
    !data.header?.publicKeyHash ||
    !data.header.ephemeralPublicKey ||
    !data.header.transactionId ||
    !data.signature ||
    data.version !== 'EC_v1'
  ) {
    throw new Error('Unsupported Apple Pay network or incomplete EC_v1 token.');
  }
  return {
    paymentProductId: 302,
    authorizationMode: AuthorizationMode.SALE,
    encryptedPaymentData: data.data,
    publicKeyHash: data.header.publicKeyHash,
    ephemeralKey: data.header.ephemeralPublicKey,
    threeDSecure: { redirectionData: { returnUrl } },
    paymentProduct302SpecificInput: {
      integrationType: 'MERCHANT_CERTIFICATE',
      network,
      token: {
        signature: data.signature,
        version: ApplePaymentTokenVersion.EC_V1,
        header: { transactionId: data.header.transactionId },
      },
    },
  };
}
