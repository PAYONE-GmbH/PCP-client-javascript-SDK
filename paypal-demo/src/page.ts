import { backendConfig, CommerceBackend } from './backend';
import type { PayPalCheckoutOptions } from './checkout';
import { money, quote } from './pricing';
import { attachStatus, result, show } from './ui';

export function setupPage() {
  const config = backendConfig(location.href, import.meta.env);
  for (const link of document.querySelectorAll<HTMLAnchorElement>('nav a')) {
    const target = new URL(link.href);
    target.search = '';
    target.searchParams.set('backendUrl', config.backendUrl);
    target.searchParams.set('shipping', config.shippingOptionId);
    for (const key of ['clientId', 'merchantId', 'intent', 'locale']) {
      const value = new URL(location.href).searchParams.get(key);
      if (value !== null) target.searchParams.set(key, value);
    }
    link.href = target.href;
  }
  const backend = new CommerceBackend(config);
  const blocked = attachStatus(backend);
  const shipping = document.querySelector<HTMLSelectElement>('#shipping')!;
  shipping.value = config.shippingOptionId;
  const updateTotal = () => {
    document.querySelector('#total')!.textContent =
      `Total €${money(quote('DE', shipping.value).total)} (including tax)`;
  };
  shipping.addEventListener('change', updateTotal);
  updateTotal();
  const options: PayPalCheckoutOptions = {
    returnUrl: config.returnUrl,
    submit: (input, contact, optionId) =>
      backend.createOrder(input, contact.customer, contact.shippingAddress, optionId),
    onResult: result,
  };
  return { config, backend, blocked, shipping, options };
}

export function missingReturnContext() {
  show(
    'No saved PayPal attempt found for this return. Reconcile the payment in the backend before starting again.',
  );
}
