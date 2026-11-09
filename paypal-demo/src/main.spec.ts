/** Standard entry: request snapshot, duplicate protection and reload recovery. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  sessionStorage.clear();
  vi.stubEnv('VITE_BACKEND_BASE_URL', 'https://api.test/api/');
  vi.stubEnv('VITE_SHIPPING_OPTION', 'express');
  document.body.innerHTML = `<form id="contact"><fieldset id="fields" disabled>
    <input name="firstName" value="Ada"><input name="surname" value="Example">
    <input name="email" value="ada@example.test"><input name="street" value="Test 1">
    <input name="zip" value="10115"><input name="city" value="Berlin">
    <select id="shipping" name="shipping"><option value="standard">Standard</option><option value="express">Express</option></select>
    </fieldset></form><p id="total"></p><p id="status"></p><button id="check-status"></button>`;
});
afterEach(() => {
  window.dispatchEvent(new Event('pagehide'));
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  document.body.replaceChildren();
});
const submit = () =>
  document.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));

it('submits one immutable contact/cart snapshot and stores only correlation IDs', async () => {
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({
      commerceCaseId: 'case',
      checkout: {
        checkoutId: 'checkout',
        paymentResponse: { payment: { id: 'pay', status: 'CAPTURED' } },
      },
    }),
  });
  vi.stubGlobal('fetch', fetch);
  await import('./main');
  submit();
  (document.querySelector('[name="city"]') as HTMLInputElement).value = 'Changed';
  submit();
  await vi.waitFor(() =>
    expect(document.querySelector('#status')!.textContent).toContain('captured'),
  );
  expect(fetch).toHaveBeenCalledOnce();
  const request = JSON.parse(fetch.mock.calls[0][1].body);
  expect(request.checkout.amountOfMoney.amount).toBe(2980);
  expect(request.checkout.shipping.address.city).toBe('Berlin');
  expect(
    request.checkout.shoppingCart.items.map((item: any) => item.orderLineDetails.productPrice),
  ).toEqual([1990, 990]);
  expect(
    request.checkout.orderRequest.paymentMethodSpecificInput.redirectPaymentMethodSpecificInput,
  ).toMatchObject({
    paymentProductId: 840,
    requiresApproval: false,
    paymentProduct840SpecificInput: { javaScriptSdkFlow: false, addressSelectionAtPayPal: false },
  });
  expect(sessionStorage.getItem('paypal:order:https://api.test/api/')).not.toContain('ada@');
});

it('blocks an uncertain POST across reload and reports a missing env explicitly', async () => {
  const fetch = vi.fn().mockRejectedValue(new Error('lost response'));
  vi.stubGlobal('fetch', fetch);
  await import('./main');
  submit();
  await vi.waitFor(() =>
    expect(document.querySelector('#status')!.textContent).toContain('network'),
  );
  window.dispatchEvent(new Event('pagehide'));
  vi.resetModules();
  await import('./main');
  await vi.waitFor(() =>
    expect(document.querySelector('#status')!.textContent).toContain('No checkout IDs'),
  );
  expect(fetch).toHaveBeenCalledOnce();
  vi.resetModules();
  vi.stubEnv('VITE_BACKEND_BASE_URL', '');
  await import('./main');
  expect(document.querySelector('#status')!.textContent).toContain('Missing VITE_BACKEND_BASE_URL');
});
