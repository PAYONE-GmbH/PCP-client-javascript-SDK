import type { PayPalExpressContext } from 'pcp-client-javascript-sdk';
import { createExpressCheckout } from './checkout';
import { missingReturnContext, setupPage } from './page';
import { formContact } from './payment';
import { show, showError } from './ui';

async function main() {
  const { backend, blocked, shipping, options } = setupPage();
  if (blocked) return;
  const key = `${backend.storageKey}:intent`;
  const guardKey = `${backend.storageKey}:intent-attempt`;
  const start = document.querySelector<HTMLButtonElement>('#start')!;
  const cancel = document.querySelector<HTMLButtonElement>('#cancel')!;
  const form = document.querySelector<HTMLFormElement>('#contact')!;
  const fields = document.querySelector<HTMLFieldSetElement>('#fields')!;
  const context = JSON.parse(sessionStorage.getItem(key) ?? 'null') as PayPalExpressContext | null;
  const instance = createExpressCheckout({
    ...options,
    // The SDK owns post-confirmation navigation, after saving the result.
    onResult: (payment) =>
      show(
        payment.status === 'failed'
          ? `${payment.code}: ${payment.message}`
          : `Payment ${payment.status}. Check payment status after return.`,
      ),
    createIntent: () => backend.createIntent(),
    loadIntent: (id) => backend.loadIntent(id),
    persist: (saved) => {
      if (saved) sessionStorage.setItem(key, JSON.stringify(saved));
      else sessionStorage.removeItem(key);
    },
    review: () => ({
      shippingAddress: formContact(form).shippingAddress,
      shippingOptionId: shipping.value,
    }),
    onCancel: () => {
      sessionStorage.removeItem(guardKey);
      fields.disabled = true;
      start.disabled = false;
      cancel.disabled = true;
      show('Local PayPal review cancelled. No CommerceCase order was submitted.');
    },
  });
  start.addEventListener('click', () => {
    start.disabled = true;
    show('Creating PayPal PaymentIntent …');
    void instance.start().catch(showError);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    // Read the form before disabling its controls (FormData omits disabled fields).
    const confirmation = instance.confirm();
    fields.disabled = true;
    cancel.disabled = true;
    void confirmation.catch(showError);
  });
  cancel.addEventListener('click', () => {
    try {
      instance.cancel();
    } catch (error) {
      showError(error);
    }
  });
  if (context) {
    const intent = await instance.resume(context);
    if (context.phase !== 'redirected' && context.phase !== 'review') {
      show(
        'An order confirmation already started. Reconcile it in the backend; do not submit again.',
      );
      return;
    }
    const output = intent.redirectPaymentMethodSpecificOutput!.paymentProduct840SpecificOutput!;
    const address = output.shippingAddress!;
    const values = {
      firstName: address.name?.firstName,
      surname: address.name?.surname,
      street: [address.street, address.houseNumber].filter(Boolean).join(' '),
      zip: address.zip,
      city: address.city,
      additionalInfo: address.additionalInfo,
    };
    for (const [name, value] of Object.entries(values)) {
      (form.elements.namedItem(name) as HTMLInputElement).value = value ?? '';
    }
    document.querySelector('#account')!.textContent =
      `PayPal account: ${output.customerAccount?.emailAddress ?? 'not supplied'}. Delivery country: ${address.countryCode ?? 'not supplied'}.`;
    if (address.countryCode !== 'DE') {
      show('This demo ships only to Germany. Cancel this local review to start again.');
      cancel.disabled = false;
      return;
    }
    fields.disabled = false;
    cancel.disabled = false;
    show(
      'Verify the delivery address and shipping price, then place your order. PayPal approval alone is not a completed payment.',
    );
  } else if (sessionStorage.getItem(guardKey)) {
    show(
      'An intent creation was already started without saved redirect context. Reconcile it in the backend before retrying.',
    );
  } else if (new URL(location.href).searchParams.has('returned')) missingReturnContext();
  else {
    start.disabled = false;
    show('Continue to PayPal to select your delivery address.');
  }
}

void main().catch(showError);
