/** Small shared helpers: final Google contacts/token, Commerce results and text output. */
import {
  AuthorizationMode,
  type AddressPersonal,
  type Customer,
  type MobilePaymentMethodSpecificInput,
  type ExpressPaymentReference,
  type ExpressPaymentResult,
} from 'pcp-client-javascript-sdk';
import type { CreateResponse, CheckoutResponse } from './api/commerce-api.service';

export function googleContact(contact: google.payments.api.Address): AddressPersonal {
  const words = (contact.name ?? '').trim().split(/\s+/);
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
  if (!billing || !payment.shippingAddress || !payment.email) {
    throw new Error('Missing final customer details.');
  }
  const { name, ...billingAddress } = googleContact(billing);
  return {
    billingAddress,
    personalInformation: { name },
    contactDetails: {
      emailAddress: payment.email,
      phoneNumber: billing.phoneNumber || payment.shippingAddress.phoneNumber,
    },
  };
}

/** UTF-8/Base64 encode the original token exactly once; never parse or reserialize it. */
export function googleInput(
  payment: google.payments.api.PaymentData | string,
  returnUrl: string,
): MobilePaymentMethodSpecificInput {
  const token =
    typeof payment === 'string' ? payment : payment.paymentMethodData.tokenizationData.token;
  if (typeof token !== 'string' || !token) {
    throw new Error('Missing Google Pay token.');
  }
  return {
    paymentProductId: 320,
    authorizationMode: AuthorizationMode.SALE,
    encryptedPaymentData: btoa(
      Array.from(new TextEncoder().encode(token), (byte) => String.fromCharCode(byte)).join(''),
    ),
    threeDSecure: { redirectionData: { returnUrl } },
  };
}

const failedStatuses = ['REJECTED', 'REJECTED_CAPTURE', 'CANCELLED'];
export function mapCreated(body: CreateResponse, status: number): ExpressPaymentResult {
  const checkout = body.checkout;
  const payment = checkout?.paymentResponse?.payment;
  const reference = {
    commerceCaseId: body.commerceCaseId,
    checkoutId: checkout?.checkoutId,
    paymentId: payment?.id,
  };
  if (status === 202 || checkout?.errorResponse || failedStatuses.includes(payment?.status ?? '')) {
    const configurationError = checkout?.errorResponse?.errors?.some(
      (error) => error.errorCode === '1201' || error.id === 'PAYMENT_PRODUCT_CONFIGURATION_ERROR',
    );
    return {
      status: 'failed',
      code: configurationError ? 'PAYMENT_PRODUCT_CONFIGURATION_ERROR' : 'PAYMENT_FAILED',
      message: configurationError
        ? 'Check PAYONE product 320 and merchant/environment configuration.'
        : 'Payment rejected or cancelled.',
    };
  }
  const redirectUrl = checkout?.paymentResponse?.merchantAction?.redirectData?.redirectURL;
  if (redirectUrl) {
    return { ...reference, status: 'requires-action', redirectUrl };
  }
  return { ...reference, status: payment?.status === 'CAPTURED' ? 'succeeded' : 'pending' };
}

export function mapCheckout(
  body: CheckoutResponse,
  reference: ExpressPaymentReference,
): ExpressPaymentResult {
  if (body.statusOutput?.paymentStatus === 'PAYMENT_COMPLETED') {
    return { ...reference, status: 'succeeded' };
  }
  const events = body.paymentExecutions?.flatMap((execution) => execution.events ?? []) ?? [];
  if (failedStatuses.includes(events[events.length - 1]?.paymentStatus ?? '')) {
    return { status: 'failed', code: 'PAYMENT_FAILED', message: 'Payment rejected or cancelled.' };
  }
  return { ...reference, status: 'pending' };
}

export const show = (message: string) => {
  document.querySelector('#status')!.textContent = message;
};
export function showError(error: unknown): void {
  show(
    error instanceof Error
      ? error.message
      : error && typeof error === 'object' && 'statusMessage' in error
        ? String(error.statusMessage)
        : 'Payment failed.',
  );
}
export function showResult(result: ExpressPaymentResult): void {
  if (result.status === 'failed') {
    show(`${result.code}: ${result.message}`);
  } else if (result.status === 'succeeded') {
    show('Payment captured / checkout paid.');
  } else if (result.status === 'pending') {
    show('Payment pending. Check payment status.');
  } else {
    const url = new URL(result.redirectUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid payment redirect URL.');
    }
    location.assign(url.href);
  }
}
