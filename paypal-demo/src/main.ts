import { createStandardCheckout } from './checkout';
import { missingReturnContext, setupPage } from './page';
import { formContact } from './payment';
import { show, showError } from './ui';

function main() {
  const { blocked, shipping, options } = setupPage();
  if (blocked) return;
  if (new URL(location.href).searchParams.has('returned')) return missingReturnContext();
  const form = document.querySelector<HTMLFormElement>('#contact')!;
  const fields = document.querySelector<HTMLFieldSetElement>('#fields')!;
  fields.disabled = false;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const contact = formContact(form);
    const checkout = createStandardCheckout(options, contact, shipping.value);
    fields.disabled = true;
    show('Creating PayPal payment …');
    void checkout.pay().catch(showError);
  });
  show('Enter your billing and delivery address, then continue to PayPal.');
}

try {
  main();
} catch (error) {
  showError(error);
}
