import { createExpressCheckout } from './checkout';
import { checkoutPage } from './page';
import { show, showError } from './ui';
import './style.css';

async function main() {
  const page = checkoutPage();
  if (!page) return;
  let disposed = false;
  let checkout: Awaited<ReturnType<typeof createExpressCheckout>> | undefined;
  window.addEventListener(
    'pagehide',
    () => {
      disposed = true;
      checkout?.destroy();
    },
    { once: true },
  );
  checkout = await createExpressCheckout(page.options);
  if (disposed) {
    checkout.destroy();
    return;
  }
  show('Choose Google Pay and select address/shipping inside the wallet.');
}

void main().catch(showError);
