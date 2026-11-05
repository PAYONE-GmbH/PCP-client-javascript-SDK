import type { ExpressPaymentResult } from 'pcp-client-javascript-sdk';
import type { CommerceBackend } from './backend';

export const show = (message: string) => {
  document.querySelector('#status')!.textContent = message;
};
export function showError(error: unknown): void {
  if (error instanceof Error) {
    show(error.message);
    return;
  }
  // Google rejects some requests with a plain PaymentsError, not an Error instance.
  if (
    error &&
    typeof error === 'object' &&
    'statusMessage' in error &&
    typeof error.statusMessage === 'string'
  ) {
    const code =
      'statusCode' in error && typeof error.statusCode === 'string' ? `${error.statusCode}: ` : '';
    show(`${code}${error.statusMessage}`);
    return;
  }
  show('Payment failed.');
}

export function result(result: ExpressPaymentResult): void {
  if (result.status === 'failed') show(`${result.code}: ${result.message}`);
  else if (result.status === 'succeeded') show('Payment captured / checkout paid.');
  else if (result.status === 'pending')
    show('Payment pending. Use “Check payment status” to reconcile.');
  else {
    show('Further authorization required. Redirecting …');
    const target = new URL(result.redirectUrl);
    if (!['http:', 'https:'].includes(target.protocol))
      throw new Error('Invalid payment redirect URL.');
    window.location.assign(target.href);
  }
}

export function attachStatus(backend: CommerceBackend): boolean {
  document.querySelector('#check-status')!.addEventListener('click', () => {
    const attempt = backend.getAttempt();
    if (!attempt?.reference) {
      show(
        'No checkout IDs available. Reconcile an uncertain POST in the backend before retrying.',
      );
      return;
    }
    void backend.status(attempt.reference).then(result).catch(showError);
  });
  const attempt = backend.getAttempt();
  if (!attempt) return false;
  show(
    'An order attempt is saved in this tab. Check its status; no new payment will be submitted.',
  );
  if (attempt.reference) void backend.status(attempt.reference).then(result).catch(showError);
  return true;
}
