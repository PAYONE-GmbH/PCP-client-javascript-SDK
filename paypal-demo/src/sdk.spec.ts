/** Official PayPal entry: frozen form, native order ID and single PAYONE completion. */
import { loadScript, type PayPalButtonsComponentOptions } from '@paypal/paypal-js';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('@paypal/paypal-js', () => ({ loadScript: vi.fn() }));
let callbacks: PayPalButtonsComponentOptions;
const button = {
  render: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  isEligible: () => true,
};
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  sessionStorage.clear();
  for (const [key, value] of Object.entries({
    VITE_BACKEND_BASE_URL: 'https://api.test/api/',
    VITE_SHIPPING_OPTION: 'express',
    VITE_PAYPAL_CLIENT_ID: 'client',
    VITE_PAYPAL_MERCHANT_ID: 'merchant',
    VITE_PAYPAL_INTENT: 'capture',
    VITE_PAYPAL_LOCALE: 'de_DE',
  })) {
    vi.stubEnv(key, value);
  }
  document.body.innerHTML = `<form id="contact"><fieldset id="fields" disabled>
    <input name="firstName" value="Ada"><input name="surname" value="Example">
    <input name="email" value="ada@example.test"><input name="street" value="Test 1">
    <input name="zip" value="10115"><input name="city" value="Berlin">
    <select id="shipping" name="shipping"><option value="standard">Standard</option><option value="express">Express</option></select>
    </fieldset></form><p id="total"></p><p id="status"></p><button id="check-status"></button><button id="edit"></button><div id="paypal-button"></div>`;
  vi.mocked(loadScript).mockResolvedValue({
    Buttons: (options: PayPalButtonsComponentOptions) => {
      callbacks = options;
      return button;
    },
    FUNDING: { PAYPAL: 'paypal' },
  } as any);
});
afterEach(() => {
  window.dispatchEvent(new Event('pagehide'));
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  document.body.replaceChildren();
});
const response = (body: unknown, status = 200) => ({ ok: true, status, json: async () => body });
const created = {
  commerceCaseId: 'case',
  checkout: {
    checkoutId: 'checkout',
    paymentResponse: {
      payment: {
        id: 'PAYONE-ID',
        status: 'PENDING_APPROVAL',
        paymentOutput: {
          redirectPaymentMethodSpecificOutput: { payPalTransactionId: 'PAYPAL-ID' },
        },
      },
    },
  },
};
async function setup() {
  await import('./sdk');
  document.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
  await vi.waitFor(() => expect(button.render).toHaveBeenCalled());
}
const create = () => callbacks.createOrder!({} as any, {} as any);
const approve = (orderID = 'PAYPAL-ID') => callbacks.onApprove!({ orderID }, {} as any);

it.each(['capture', 'authorize'] as const)(
  'uses %s consistently and completes concurrent approvals exactly once',
  async (intent) => {
    vi.stubEnv('VITE_PAYPAL_INTENT', intent);
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response(created))
      .mockResolvedValueOnce(response({ payment: { status: 'CAPTURED' } }))
      .mockResolvedValueOnce(response({ statusOutput: { paymentStatus: 'PAYMENT_COMPLETED' } }));
    vi.stubGlobal('fetch', fetch);
    await setup();
    (document.querySelector('[name="city"]') as HTMLInputElement).value = 'Changed';
    expect(await Promise.all([create(), create()])).toEqual(['PAYPAL-ID', 'PAYPAL-ID']);
    const request = JSON.parse(fetch.mock.calls[0][1].body);
    expect(request.checkout.shipping.address.city).toBe('Berlin');
    expect(request.checkout.amountOfMoney.amount).toBe(2980);
    expect(
      request.checkout.orderRequest.paymentMethodSpecificInput.redirectPaymentMethodSpecificInput,
    ).toMatchObject({
      requiresApproval: intent === 'authorize',
      paymentProduct840SpecificInput: { javaScriptSdkFlow: true },
    });
    expect(loadScript).toHaveBeenCalledWith(
      expect.objectContaining({ intent, clientId: 'client', merchantId: 'merchant' }),
    );
    await expect(approve('FOREIGN')).rejects.toThrow('mismatch');
    expect(fetch).toHaveBeenCalledOnce();
    await Promise.all([approve(), approve()]);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({
      completePaymentMethodSpecificInput: {
        paymentProduct840SpecificInput: { javaScriptSdkFlow: true, action: 'CONFIRM_ORDER_STATUS' },
      },
    });
    expect(document.querySelector('#status')!.textContent).toContain('captured');
  },
);

it('keeps uncertain completion single-shot across callback repetition and reload', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(response(created))
    .mockRejectedValueOnce(new Error('timeout'));
  vi.stubGlobal('fetch', fetch);
  await setup();
  await create();
  await expect(approve()).rejects.toThrow('network');
  await approve();
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(JSON.parse(sessionStorage.getItem('paypal:order:https://api.test/api/')!).completion).toBe(
    'submitting',
  );
  window.dispatchEvent(new Event('pagehide'));
  fetch.mockResolvedValue(response({ statusOutput: { paymentStatus: 'WAITING_FOR_PAYMENT' } }));
  vi.resetModules();
  await import('./sdk');
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
  expect(fetch.mock.calls[2][1].method).toBe('GET');
});

it('synchronizes cancellation of a known order and ignores callbacks after pagehide', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(response(created))
    .mockResolvedValueOnce(response({ payment: { status: 'REJECTED' } }));
  vi.stubGlobal('fetch', fetch);
  await setup();
  await create();
  await callbacks.onCancel!({ orderID: 'PAYPAL-ID' }, {} as any);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(document.querySelector('#status')!.textContent).toContain('PAYMENT_FAILED');
  window.dispatchEvent(new Event('pagehide'));
  await approve();
  expect(fetch).toHaveBeenCalledTimes(2);
});

it('closes the button when editing and ignores its old callbacks', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  await setup();
  const previous = callbacks;
  (document.querySelector('#edit') as HTMLButtonElement).click();
  await vi.waitFor(() =>
    expect((document.querySelector('#fields') as HTMLFieldSetElement).disabled).toBe(false),
  );
  expect(button.close).toHaveBeenCalled();
  await expect(previous.createOrder!({} as any, {} as any)).rejects.toThrow('closed');
  previous.onError!({ message: 'late SDK error' });
  expect(document.querySelector('#status')!.textContent).toContain('Edit your address');
  expect(fetch).not.toHaveBeenCalled();
});

it('does not substitute a PAYONE payment ID for a missing PayPal order ID', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      response({
        commerceCaseId: 'case',
        checkout: { checkoutId: 'checkout', paymentResponse: { payment: { id: 'PAYONE-ID' } } },
      }),
    ),
  );
  await setup();
  await expect(create()).rejects.toThrow('payPalTransactionId');
});
