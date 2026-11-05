import { backendConfig, CommerceBackend } from './backend';
import { attachStatus, result, show, showError } from './ui';
import { appleContact, appleCustomer, appleInput } from './payment';
import type { AppleCheckoutOptions } from './checkout';

/** Wire either page to the same existing Commerce API and status handling. */
export function checkoutPage(): { options: AppleCheckoutOptions; backend: CommerceBackend } | null {
  const config = backendConfig(location.href, import.meta.env);
  const backend = new CommerceBackend(config);
  document.querySelectorAll<HTMLAnchorElement>('a[href$=".html"]').forEach((link) => {
    const target = new URL(link.href);
    target.searchParams.set('backendUrl', config.backendUrl);
    if (config.validateMerchantUrl)
      target.searchParams.set('validateMerchantUrl', config.validateMerchantUrl);
    link.href = target.href;
  });
  if (attachStatus(backend)) return null;
  if (!config.validateMerchantUrl)
    throw new Error('Set validateMerchantUrl or VITE_VALIDATE_MERCHANT_URL.');
  return {
    backend,
    options: {
      validateMerchantURL: config.validateMerchantUrl,
      label: 'PAYONE demo',
      button: {
        selector: '#wallet',
        config: {
          buttonstyle: 'black',
          type: 'check-out',
          locale: 'de-DE',
          style: { width: '240px', height: '44px' },
        },
      },
      submit: (payment, optionId) =>
        backend.createOrder(
          { mobilePaymentMethodSpecificInput: appleInput(payment, config.returnUrl) },
          appleCustomer(payment),
          appleContact(payment.shippingContact),
          optionId,
        ),
      onResult: result,
      onCancel: () => show('Apple Pay cancelled. No new order will be submitted automatically.'),
      onError: (_phase, error) => showError(error),
    },
  };
}
