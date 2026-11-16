/** Small Apple contact/token mappings and backend-result display helpers shared by both pages. */
import {
  Network,
  AuthorizationMode,
  ApplePaymentTokenVersion,
  type AddressPersonal,
  type Customer,
  type MobilePaymentMethodSpecificInput,
  type ExpressPaymentReference,
  type ExpressPaymentResult,
} from 'pcp-client-javascript-sdk';
import type { CreateResponse, CheckoutResponse } from './api/commerce-api.service';

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

const failedStatuses = ['REJECTED', 'REJECTED_CAPTURE', 'CANCELLED'];

export function mapCreated(body: CreateResponse, httpStatus: number): ExpressPaymentResult {
  const checkout = body.checkout;
  const payment = checkout?.paymentResponse?.payment;
  const reference = {
    commerceCaseId: body.commerceCaseId,
    checkoutId: checkout?.checkoutId,
    paymentId: payment?.id,
  };
  if (
    httpStatus === 202 ||
    checkout?.errorResponse ||
    failedStatuses.includes(payment?.status ?? '')
  ) {
    return {
      status: 'failed',
      code: 'PAYMENT_FAILED',
      message:
        'PAYONE did not complete the payment. Reconcile the created checkout before another attempt.',
    };
  }
  const redirectUrl = checkout?.paymentResponse?.merchantAction?.redirectData?.redirectURL;
  if (redirectUrl) {
    return { ...reference, status: 'requires-action', redirectUrl };
  }
  if (payment?.status === 'CAPTURED') {
    return { ...reference, status: 'succeeded' };
  }
  return { ...reference, status: 'pending' };
}

export function mapCheckout(
  body: CheckoutResponse,
  reference: ExpressPaymentReference,
): ExpressPaymentResult {
  if (body.statusOutput?.paymentStatus === 'PAYMENT_COMPLETED') {
    return { ...reference, status: 'succeeded' };
  }
  // Old CAPTURED events alone could precede a refund; use checkout-level completion.
  const events = body.paymentExecutions?.flatMap((execution) => execution.events ?? []) ?? [];
  if (events.length && failedStatuses.includes(events[events.length - 1].paymentStatus ?? '')) {
    return { status: 'failed', code: 'PAYMENT_FAILED', message: 'Payment rejected or cancelled.' };
  }
  return { ...reference, status: 'pending' };
}

export function show(message: string) {
  document.querySelector('#status')!.textContent = message;
}

export function showError(error: unknown) {
  show(error instanceof Error ? error.message : 'Payment failed.');
}

export function showResult(result: ExpressPaymentResult) {
  if (result.status === 'failed') {
    show(`${result.code}: ${result.message}`);
  } else if (result.status === 'succeeded') {
    show('Payment captured / checkout paid.');
  } else if (result.status === 'pending') {
    show('Payment pending. Use “Check payment status” to reconcile.');
  } else {
    const target = new URL(result.redirectUrl);
    if (!['http:', 'https:'].includes(target.protocol)) {
      throw new Error('Invalid payment redirect URL.');
    }
    show('Further authorization required. Redirecting …');
    window.location.assign(target.href);
  }
}
