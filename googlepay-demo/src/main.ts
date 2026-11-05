import { createStandardCheckout, type CheckoutHandle } from './checkout';
import { checkoutPage } from './page';
import { money, quote, shippingOptions } from './pricing';
import { show, showError } from './ui';
import './style.css';

function main() {
  const page = checkoutPage();
  const form = document.querySelector<HTMLFormElement>('#checkout')!;
  const fields = form.querySelector<HTMLFieldSetElement>('fieldset')!;
  if (!page) {
    fields.disabled = true;
    return;
  }
  const select = form.querySelector<HTMLSelectElement>('[name=shipping]')!;
  select.replaceChildren(
    ...shippingOptions.map(
      (option) => new Option(`${option.label} · €${money(option.cents)}`, option.id),
    ),
  );
  const updateTotal = () => {
    document.querySelector('#total')!.textContent = `€${money(quote('DE', select.value).total)}`;
  };
  select.addEventListener('change', updateTotal);
  updateTotal();
  const edit = document.querySelector<HTMLButtonElement>('#edit')!;
  let instance: CheckoutHandle | undefined;
  let preparing = false;
  let disposed = false;
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
        name: `${value('givenName')} ${value('familyName')}`,
        phoneNumber: value('phone'),
        address1: value('street'),
        address2: '',
        address3: '',
        sortingCode: '',
        administrativeArea: '',
        postalCode: value('postalCode'),
        locality: value('city'),
        countryCode: 'DE',
      },
      value('email'),
      value('shipping'),
    )
      .then((checkout) => {
        if (disposed) {
          checkout.destroy();
          return;
        }
        instance = checkout;
        edit.hidden = false;
        show('Checkout details confirmed. Choose Google Pay to authorize payment.');
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
    show('Update checkout details and continue again.');
  });
  window.addEventListener(
    'pagehide',
    () => {
      disposed = true;
      instance?.destroy();
    },
    { once: true },
  );
  show('Enter billing/shipping details and choose shipping before opening Google Pay.');
}

try {
  main();
} catch (error) {
  showError(error);
}
