import { paypalConfig } from './config';
import { createSdkCheckout } from './sdk-checkout';
import { missingReturnContext, setupPage } from './page';
import { formContact } from './payment';
import { result, show, showError } from './ui';

function main() {
  const { config, backend, blocked, shipping } = setupPage();
  if (blocked) return;
  if (new URL(location.href).searchParams.has('returned')) return missingReturnContext();
  const form = document.querySelector<HTMLFormElement>('#contact')!;
  const fields = document.querySelector<HTMLFieldSetElement>('#fields')!;
  const sdk = paypalConfig(location.href, import.meta.env);
  const edit = document.querySelector<HTMLButtonElement>('#edit')!;
  let checkout: Awaited<ReturnType<typeof createSdkCheckout>> | undefined;
  let preparing = false;
  let disposed = false;
  fields.disabled = false;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (preparing || checkout || backend.getAttempt() || !form.reportValidity()) return;
    const contact = formContact(form);
    preparing = true;
    fields.disabled = true;
    show('Loading PayPal button …');
    void createSdkCheckout(
      {
        ...sdk,
        selector: '#paypal-button',
        returnUrl: config.returnUrl,
        createOrder: (input, contact, option) => {
          edit.disabled = true;
          show('Creating PAYONE order for the PayPal popup …');
          return backend.createSdkOrder(input, contact.customer, contact.shippingAddress, option);
        },
        completeOrder: (order) => backend.completeSdkOrder(order),
        onResult: result,
        onCancel: (payment) => {
          if (payment?.status === 'succeeded') result(payment);
          else
            show(
              'PayPal window cancelled. PAYONE status synchronized; check payment status before another attempt.',
            );
        },
        onError: showError,
      },
      contact,
      shipping.value,
    )
      .then(async (handle) => {
        if (disposed) {
          await handle.destroy();
          return;
        }
        checkout = handle;
        edit.disabled = false;
        show(
          'Use the PayPal button to open checkout. The shop address and price are fixed for this attempt.',
        );
      })
      .catch((error) => {
        if (!disposed) {
          if (!backend.getAttempt()) fields.disabled = false;
          showError(error);
        }
      })
      .finally(() => {
        preparing = false;
      });
  });
  edit.addEventListener('click', () => {
    if (!checkout || preparing || backend.getAttempt()) return;
    const old = checkout;
    preparing = true;
    edit.disabled = true;
    void old
      .destroy()
      .then(() => {
        checkout = undefined;
        fields.disabled = false;
        show('Edit your address or shipping option, then prepare the PayPal button again.');
      })
      .catch(showError)
      .finally(() => {
        preparing = false;
      });
  });
  window.addEventListener(
    'pagehide',
    () => {
      disposed = true;
      void checkout?.destroy();
    },
    { once: true },
  );
  show('Enter your billing and delivery address, then prepare the PayPal button.');
}

try {
  main();
} catch (error) {
  showError(error);
}
