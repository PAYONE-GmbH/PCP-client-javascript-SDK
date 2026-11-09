/** Standard entry: merchant snapshot, duplicate protection and button cleanup. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { PCPApplePaySessionConfig } from 'pcp-client-javascript-sdk';

let request: PCPApplePaySessionConfig;
const destroy = vi.fn();
beforeEach(() => {
  vi.resetModules();
  sessionStorage.clear();
  destroy.mockClear();
  for (const [key, value] of Object.entries({
    VITE_BACKEND_BASE_URL: 'https://api.test/api/',
    VITE_VALIDATE_MERCHANT_URL: 'https://api.test/validate',
    VITE_APPLE_MERCHANT_NAME: 'Test shop',
    VITE_APPLE_BUTTON_LOCALE: 'de-DE',
  })) {
    vi.stubEnv(key, value);
  }
  document.body.innerHTML = `<form id="checkout"><fieldset>
    <input name="givenName" value="Ada"><input name="familyName" value="Example"><input name="email" value="ada@example.test"><input name="phone" value="123">
    <input name="street" value="Test 1"><input name="postalCode" value="10115"><input name="city" value="Berlin">
    <select name="shipping"><option value="express">Express</option></select></fieldset></form>
    <button id="edit" hidden></button><div id="wallet"></div><p id="status"></p><button id="check-status"></button>`;
});
afterEach(() => {
  window.dispatchEvent(new Event('pagehide'));
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  document.body.replaceChildren();
});
const payment = {
  token: {
    paymentMethod: { network: 'Visa' },
    paymentData: {
      data: 'encrypted',
      signature: 'signature',
      version: 'EC_v1',
      header: {
        publicKeyHash: 'key',
        ephemeralPublicKey: 'ephemeral',
        transactionId: 'transaction',
      },
    },
  },
} as unknown as ApplePayJS.ApplePayPayment;
async function setup() {
  const { PCPApplePaySession } = await import('pcp-client-javascript-sdk');
  vi.spyOn(PCPApplePaySession, 'create').mockImplementation(async (config) => {
    request = config;
    return { destroy } as any;
  });
  await import('./main');
  document.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
  await vi.waitFor(() =>
    expect(document.querySelector('#status')!.textContent).toContain('confirmed'),
  );
}

it('uses the frozen shop contact without inventing wallet contacts and posts once', async () => {
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({
      commerceCaseId: 'case',
      checkout: { checkoutId: 'checkout', paymentResponse: { payment: { status: 'CAPTURED' } } },
    }),
  });
  vi.stubGlobal('fetch', fetch);
  await setup();
  expect(request.total).toMatchObject({ label: 'Test shop', amount: '29.80' });
  expect(request.requiredShippingContactFields).toBeUndefined();
  (document.querySelector('[name="city"]') as HTMLInputElement).value = 'Changed';
  const pending = request.processPaymentCallback!(payment);
  await expect(request.processPaymentCallback!(payment)).rejects.toThrow('already exists');
  expect(await pending).toMatchObject({ status: 'succeeded' });
  expect(fetch).toHaveBeenCalledOnce();
  const body = JSON.parse(fetch.mock.calls[0][1].body);
  expect(body.checkout.shipping.address.city).toBe('Berlin');
  expect(body.customer.contactDetails.emailAddress).toBe('ada@example.test');
  expect(body.checkout.amountOfMoney.amount).toBe(2980);
  expect(
    body.checkout.shoppingCart.items.map((item: any) => item.orderLineDetails.productPrice),
  ).toEqual([1990, 990]);
  expect(
    body.checkout.orderRequest.paymentMethodSpecificInput.mobilePaymentMethodSpecificInput
      .encryptedPaymentData,
  ).toBe('encrypted');
  expect(
    sessionStorage.getItem('express:apple:https://api.test/api/:backend-managed'),
  ).not.toContain('encrypted');
});

it('invalidates old callbacks when editing', async () => {
  await setup();
  (document.querySelector('#edit') as HTMLButtonElement).click();
  expect(destroy).toHaveBeenCalledOnce();
  await expect(request.processPaymentCallback!(payment)).rejects.toThrow('closed');
  request.cancelCallback!();
  expect(document.querySelector('#status')!.textContent).toContain('Update your checkout');
});

it('blocks uncertain submissions after reload', async () => {
  const fetch = vi.fn().mockRejectedValue(new Error('lost response'));
  vi.stubGlobal('fetch', fetch);
  await setup();
  await expect(request.processPaymentCallback!(payment)).rejects.toThrow('network');
  window.dispatchEvent(new Event('pagehide'));
  vi.resetModules();
  await import('./main');
  await vi.waitFor(() =>
    expect(document.querySelector('#status')!.textContent).toContain('No checkout IDs'),
  );
  expect(fetch).toHaveBeenCalledOnce();
  expect((document.querySelector('fieldset') as HTMLFieldSetElement).disabled).toBe(true);
});
