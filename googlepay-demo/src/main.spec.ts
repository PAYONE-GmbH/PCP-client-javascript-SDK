/** Standard entry tests: merchant snapshot and concurrent callbacks create one order; uncertain writes stay blocked. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const { buttons } = vi.hoisted(() => ({ buttons: [] as any[] }));
vi.mock('@google-pay/button-element', () => {
  class TestButton extends HTMLElement {
    constructor() {
      super();
      buttons.push(this);
    }
  }
  customElements.define('test-google-pay-button', TestButton);
  return { default: TestButton };
});

beforeEach(() => {
  vi.stubEnv('VITE_BACKEND_BASE_URL', 'https://api.test/');
  vi.stubEnv('VITE_GOOGLE_ENVIRONMENT', 'TEST');
  vi.stubEnv('VITE_GOOGLE_GATEWAY_MERCHANT_ID', 'P1_test');
  vi.stubEnv('VITE_GOOGLE_MERCHANT_NAME', 'Demo');
  vi.stubEnv('VITE_GOOGLE_BUTTON_LOCALE', 'de');
  vi.stubEnv('VITE_GOOGLE_ALLOWED_AUTH_METHODS', 'CRYPTOGRAM_3DS');
  vi.resetModules();
  buttons.length = 0;
  sessionStorage.clear();
  history.replaceState(
    null,
    '',
    '/index.html?backendUrl=https://api.test/&gatewayMerchantId=P1_test',
  );
  document.body.innerHTML = `<form id="checkout"><fieldset>
    <input name="givenName" value="Example"><input name="familyName" value="Buyer">
    <input name="email" value="buyer@example.test"><input name="phone" value="+49123">
    <input name="street" value="Example 1"><input name="city" value="Berlin"><input name="postalCode" value="10115">
    <select name="shipping"><option value="express">Express</option></select>
    </fieldset></form><output id="total"></output><button id="edit"></button><div id="wallet"></div><p id="status"></p><button id="check-status"></button>`;
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it('reports a missing required environment setting', async () => {
  vi.stubEnv('VITE_GOOGLE_MERCHANT_NAME', '   ');
  await import('./main');
  expect(document.querySelector('#status')!.textContent).toContain(
    'Missing VITE_GOOGLE_MERCHANT_NAME',
  );
  expect(buttons).toHaveLength(0);
});

async function start() {
  await import('./main');
  document.querySelector('form')!.dispatchEvent(new SubmitEvent('submit', { cancelable: true }));
  return buttons[0];
}

it('submits one matching cart using the confirmed form, without Google contacts', async () => {
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({
      commerceCaseId: 'case',
      checkout: { checkoutId: 'checkout', paymentResponse: { payment: { status: 'CAPTURED' } } },
    }),
  });
  vi.stubGlobal('fetch', fetch);
  const button = await start();
  expect(button.paymentRequest.shippingAddressRequired).toBeUndefined();
  expect(button.paymentRequest.transactionInfo.totalPrice).toBe('29.80');
  // Google requires a total label whenever displayItems are supplied.
  expect(button.paymentRequest.transactionInfo.totalPriceLabel).toBe('Total');
  (document.querySelector('[name=email]') as HTMLInputElement).value = 'changed@example.test';
  const payment = { paymentMethodData: { tokenizationData: { token: 'original-token' } } };
  const [first, second] = await Promise.all([
    button.onPaymentAuthorized(payment),
    button.onPaymentAuthorized(payment),
  ]);
  expect(first.transactionState).toBe('SUCCESS');
  expect(second).toEqual(first);
  expect(fetch).toHaveBeenCalledOnce();
  const payload = JSON.parse(fetch.mock.calls[0][1].body);
  expect(payload.customer.contactDetails.emailAddress).toBe('buyer@example.test');
  expect(payload.checkout.amountOfMoney.amount).toBe(2980);
  expect(payload.checkout.shipping.address.street).toBe('Example 1');
});

it('keeps an uncertain POST blocked after reload', async () => {
  const fetch = vi.fn().mockRejectedValue(new Error('offline'));
  vi.stubGlobal('fetch', fetch);
  const button = await start();
  expect(
    (
      await button.onPaymentAuthorized({
        paymentMethodData: { tokenizationData: { token: 'token' } },
      })
    ).transactionState,
  ).toBe('ERROR');
  vi.resetModules();
  await import('./main');
  expect(document.querySelector('fieldset')!.disabled).toBe(true);
  expect(buttons).toHaveLength(1);
  expect(fetch).toHaveBeenCalledOnce();
});
