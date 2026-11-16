/** Express entry: verified intent correlation, editable review and no duplicate orders. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const key = 'paypal:order:https://api.test/api/';
const context = { paymentIntentId: 'intent', paymentId: 'intent-payment', phase: 'redirected' };
const intent = {
  paymentIntentId: 'intent',
  paymentId: 'intent-payment',
  redirectPaymentMethodSpecificOutput: {
    paymentProductId: 840,
    paymentProduct840SpecificOutput: {
      shippingAddress: {
        countryCode: 'DE',
        city: 'Berlin',
        zip: '10115',
        street: 'Test',
        houseNumber: '1',
        name: { firstName: 'Ada', surname: 'Example' },
      },
      billingAddress: { countryCode: 'DE', city: 'Bonn' },
      customerAccount: { emailAddress: 'buyer@example.test', firstName: 'Ada', surname: 'Example' },
    },
  },
};
beforeEach(() => {
  vi.resetModules();
  sessionStorage.clear();
  vi.stubEnv('VITE_BACKEND_BASE_URL', 'https://api.test/api/');
  vi.stubEnv('VITE_SHIPPING_OPTION', 'standard');
  document.body.innerHTML = `<button id="start" disabled></button><button id="cancel" disabled></button><form id="contact"><fieldset id="fields" disabled>
    <input name="firstName"><input name="surname"><input name="street"><input name="additionalInfo"><input name="zip"><input name="city">
    <select id="shipping" name="shipping"><option value="standard">Standard</option><option value="express">Express</option></select>
    </fieldset></form><p id="account"></p><p id="total"></p><p id="status"></p><button id="check-status"></button>`;
});
afterEach(() => {
  window.dispatchEvent(new Event('pagehide'));
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  document.body.replaceChildren();
});
const response = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

it('loads the saved intent and submits reviewed shipping once with the original payment ID', async () => {
  sessionStorage.setItem(`${key}:intent`, JSON.stringify(context));
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(response(intent))
    .mockResolvedValueOnce(
      response({
        commerceCaseId: 'case',
        checkout: { checkoutId: 'checkout', paymentResponse: { payment: { status: 'CAPTURED' } } },
      }),
    );
  vi.stubGlobal('fetch', fetch);
  await import('./express');
  await vi.waitFor(() =>
    expect((document.querySelector('#fields') as HTMLFieldSetElement).disabled).toBe(false),
  );
  expect(fetch).toHaveBeenCalledOnce();
  (document.querySelector('[name="city"]') as HTMLInputElement).value = 'Hamburg';
  (document.querySelector('#shipping') as HTMLSelectElement).value = 'express';
  const form = document.querySelector('form')!;
  form.dispatchEvent(new Event('submit', { cancelable: true }));
  form.dispatchEvent(new Event('submit', { cancelable: true }));
  await vi.waitFor(() =>
    expect(document.querySelector('#status')!.textContent).toContain('succeeded'),
  );
  expect(fetch).toHaveBeenCalledTimes(2);
  const request = JSON.parse(fetch.mock.calls[1][1].body);
  expect(request.customer.billingAddress.city).toBe('Bonn');
  expect(request.checkout.shipping.address).toMatchObject({ city: 'Hamburg', street: 'Test 1' });
  expect(request.checkout.amountOfMoney.amount).toBe(2980);
  expect(
    request.checkout.shoppingCart.items.map((item: any) => item.orderLineDetails.productPrice),
  ).toEqual([1990, 990]);
  expect(
    request.checkout.orderRequest.paymentMethodSpecificInput.redirectPaymentMethodSpecificInput
      .paymentProduct840SpecificInput,
  ).toEqual({
    paymentId: 'intent-payment',
    addressSelectionAtPayPal: false,
    javaScriptSdkFlow: false,
  });
});

it('rejects foreign intent IDs before enabling order confirmation', async () => {
  sessionStorage.setItem(`${key}:intent`, JSON.stringify(context));
  const fetch = vi.fn().mockResolvedValue(response({ ...intent, paymentId: 'foreign' }));
  vi.stubGlobal('fetch', fetch);
  await import('./express');
  await vi.waitFor(() =>
    expect(document.querySelector('#status')!.textContent).toContain('correlation mismatch'),
  );
  expect((document.querySelector('#fields') as HTMLFieldSetElement).disabled).toBe(true);
  expect(fetch).toHaveBeenCalledOnce();
});

it('persists an uncertain intent POST before sending and blocks a fresh intent after reload', async () => {
  const fetch = vi.fn().mockImplementation(async () => {
    expect(sessionStorage.getItem(`${key}:intent-attempt`)).toBe('submitting');
    throw new Error('timeout');
  });
  vi.stubGlobal('fetch', fetch);
  await import('./express');
  (document.querySelector('#start') as HTMLButtonElement).click();
  await vi.waitFor(() =>
    expect(document.querySelector('#status')!.textContent).toContain('network'),
  );
  const request = JSON.parse(fetch.mock.calls[0][1].body);
  expect(
    request.paymentMethodSpecificInput.redirectPaymentMethodSpecificInput
      .paymentProduct840SpecificInput,
  ).toEqual({ addressSelectionAtPayPal: true, javaScriptSdkFlow: false });
  window.dispatchEvent(new Event('pagehide'));
  vi.resetModules();
  await import('./express');
  expect(document.querySelector('#status')!.textContent).toContain('without saved return context');
  expect(fetch).toHaveBeenCalledOnce();
});
