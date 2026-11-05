import { show, showError } from './ui';
import { createExpressCheckout } from './checkout';
import { checkoutPage } from './page';
import './style.css';

async function main() {
  const page = checkoutPage();
  if (!page) return;
  const instance = await createExpressCheckout(page.options);
  window.addEventListener('pagehide', () => instance.destroy(), { once: true });
  show('Choose Apple Pay to select your address and shipping inside the wallet.');
}

void main().catch(showError);
