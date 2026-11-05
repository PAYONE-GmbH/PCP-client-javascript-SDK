import type { PCPApplePaySession } from 'pcp-client-javascript-sdk';
import { show, showError } from './ui';
import { createStandardCheckout } from './checkout';
import { checkoutPage } from './page';
import './style.css';

function main() {
  const page = checkoutPage();
  const form = document.querySelector<HTMLFormElement>('#checkout')!;
  const fields = form.querySelector<HTMLFieldSetElement>('fieldset')!;
  if (!page) {
    fields.disabled = true;
    return;
  }
  const edit = document.querySelector<HTMLButtonElement>('#edit')!;
  let instance: PCPApplePaySession | undefined;
  let preparing = false;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (preparing || !form.reportValidity()) return;
    preparing = true;
    const data = new FormData(form);
    const value = (key: string) => String(data.get(key) ?? '').trim();
    fields.disabled = true;
    void createStandardCheckout(
      page.options,
      {
        givenName: value('givenName'),
        familyName: value('familyName'),
        emailAddress: value('email'),
        phoneNumber: value('phone'),
        addressLines: [value('street')],
        postalCode: value('postalCode'),
        locality: value('city'),
        countryCode: 'DE',
      },
      value('shipping'),
    )
      .then((checkout) => {
        instance = checkout;
        edit.hidden = false;
        show('Address and shipping confirmed. Choose Apple Pay to authorize payment.');
      })
      .catch((error) => {
        fields.disabled = false;
        showError(error);
      })
      .finally(() => {
        preparing = false;
      });
  });
  edit.addEventListener('click', () => {
    if (page.backend.getAttempt()) {
      show('An order was already submitted. Check payment status before starting again.');
      return;
    }
    instance?.destroy();
    instance = undefined;
    fields.disabled = false;
    edit.hidden = true;
    show('Update your checkout details and continue again.');
  });
  window.addEventListener('pagehide', () => instance?.destroy(), { once: true });
  show('Enter billing/shipping details and choose shipping before opening Apple Pay.');
}

try {
  main();
} catch (error) {
  showError(error);
}
