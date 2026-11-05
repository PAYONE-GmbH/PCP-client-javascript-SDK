import { backendConfig, CommerceBackend } from './backend';
import { googleConfig } from './config';
import type { GoogleCheckoutOptions } from './checkout';
import { googleContact, googleCustomer, googleInput } from './payment';
import { attachStatus, result, show, showError } from './ui';

/** Connect either page to the host application's backend and shared return/status handling. */
export function checkoutPage(): {
  options: GoogleCheckoutOptions;
  backend: CommerceBackend;
} | null {
  const config = backendConfig(location.href, import.meta.env);
  const backend = new CommerceBackend(config);
  document.querySelectorAll<HTMLAnchorElement>('a[data-checkout-link]').forEach((link) => {
    const target = new URL(link.href);
    target.search = location.search;
    target.searchParams.delete('returned');
    target.searchParams.delete('context');
    target.searchParams.set('backendUrl', config.backendUrl);
    link.href = target.href;
  });
  // A 3DS return needs only the saved backend configuration, not a fresh Google wallet.
  if (attachStatus(backend)) return null;
  if (new URL(location.href).searchParams.has('returned'))
    throw new Error('No saved payment attempt. Reconcile the payment in your backend.');
  return {
    backend,
    options: {
      ...googleConfig(location.href, import.meta.env),
      selector: '#wallet',
      submit: (payment, optionId) => {
        if (!payment.shippingAddress) throw new Error('Missing final shipping address.');
        return backend.createOrder(
          { mobilePaymentMethodSpecificInput: googleInput(payment, config.returnUrl) },
          googleCustomer(payment),
          googleContact(payment.shippingAddress),
          optionId,
        );
      },
      onResult: result,
      onCancel: () =>
        show('Google Pay cancelled. Check payment status if an order was already submitted.'),
      onError: showError,
    },
  };
}
