/** Small contact, response and display helpers shared by the three explicit checkout examples. */
import type { ExpressPaymentReference, ExpressPaymentResult } from 'pcp-client-javascript-sdk';
import type { CreateResponse, CheckoutResponse } from './api/commerce-api.service';

export function formContact(form: HTMLFormElement) {
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
  show(
    error instanceof Error
      ? error.message
      : error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Payment failed.',
  );
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
