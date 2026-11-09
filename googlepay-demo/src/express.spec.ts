/** Express entry tests: quote callbacks do not submit; final contacts create one matching order. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { PCPGooglePayExpress } from 'pcp-client-javascript-sdk';

beforeEach(() => {
  vi.stubEnv('VITE_BACKEND_BASE_URL', 'https://api.test/');
  vi.stubEnv('VITE_GOOGLE_ENVIRONMENT', 'TEST');
  vi.stubEnv('VITE_GOOGLE_GATEWAY_MERCHANT_ID', 'P1_test');
  vi.stubEnv('VITE_GOOGLE_MERCHANT_NAME', 'Demo');
  vi.stubEnv('VITE_GOOGLE_BUTTON_LOCALE', 'de');
  vi.stubEnv('VITE_GOOGLE_ALLOWED_AUTH_METHODS', 'CRYPTOGRAM_3DS');
  vi.resetModules();
  sessionStorage.clear();
  history.replaceState(
    null,
    '',
    '/express.html?backendUrl=https://api.test/&gatewayMerchantId=P1_test',
  );
  document.body.innerHTML =
    '<div id="wallet"></div><p id="status"></p><button id="check-status"></button>';
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('requires the Google merchant ID in production', async () => {
  vi.stubEnv('VITE_GOOGLE_ENVIRONMENT', 'PRODUCTION');
  vi.stubEnv('VITE_GOOGLE_MERCHANT_ID', '');
  await import('./express');
  await vi.waitFor(() =>
    expect(document.querySelector('#status')!.textContent).toContain(
      'Missing VITE_GOOGLE_MERCHANT_ID',
    ),
  );
});

async function start() {
  const { PCPGooglePayExpress } = await import('pcp-client-javascript-sdk');
  const create = vi
    .spyOn(PCPGooglePayExpress, 'create')
    .mockResolvedValue({ destroy: vi.fn() } as unknown as PCPGooglePayExpress);
  await import('./express');
  await vi.waitFor(() => expect(create).toHaveBeenCalledOnce());
  return create.mock.calls[0][0];
}

it('updates shipping without POST and submits the final Express cart once', async () => {
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({
      commerceCaseId: 'case',
      checkout: { checkoutId: 'checkout', paymentResponse: { payment: { status: 'CAPTURED' } } },
    }),
  });
  vi.stubGlobal('fetch', fetch);
  const config = await start();
  expect(config.paymentRequest.transactionInfo.totalPrice).toBe('24.80');
  // Initial and updated displayItems both require a total label.
  expect(config.paymentRequest.transactionInfo.totalPriceLabel).toBe('Total');
  const update = await config.paymentDataChangedCallback({
    shippingAddress: { countryCode: 'DE' },
    shippingOptionData: { id: 'express' },
  } as google.payments.api.IntermediatePaymentData);
  expect(update.newTransactionInfo?.totalPrice).toBe('29.80');
  expect(update.newTransactionInfo?.totalPriceLabel).toBe('Total');
  expect(fetch).not.toHaveBeenCalled();
  const contact = {
    name: 'Example Buyer',
    countryCode: 'DE',
    address1: 'Example 1',
    locality: 'Berlin',
    postalCode: '10115',
  };
  const payment = {
    email: 'buyer@test.example',
    shippingAddress: contact,
    shippingOptionData: { id: 'express' },
    paymentMethodData: {
      tokenizationData: { token: 'original-token' },
      info: { billingAddress: contact },
    },
  } as google.payments.api.PaymentData;
  expect((await config.processPaymentCallback(payment)).status).toBe('succeeded');
  const payload = JSON.parse(fetch.mock.calls[0][1].body);
  expect(payload.checkout.amountOfMoney.amount).toBe(2980);
  expect(
    payload.checkout.shoppingCart.items.reduce(
      (sum: number, item: { orderLineDetails: { productPrice: number } }) =>
        sum + item.orderLineDetails.productPrice,
      0,
    ),
  ).toBe(2980);
  expect(
    atob(
      payload.checkout.orderRequest.paymentMethodSpecificInput.mobilePaymentMethodSpecificInput
        .encryptedPaymentData,
    ),
  ).toBe('original-token');
  await expect(config.processPaymentCallback(payment)).rejects.toThrow('already submitted');
  expect(fetch).toHaveBeenCalledOnce();
});

it('restores checkout IDs after reload and performs only GET', async () => {
  sessionStorage.setItem(
    'google:express:https://api.test/',
    JSON.stringify({ commerceCaseId: 'case', checkoutId: 'checkout' }),
  );
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ statusOutput: { paymentStatus: 'PAYMENT_COMPLETED' } }),
  });
  vi.stubGlobal('fetch', fetch);
  const { PCPGooglePayExpress } = await import('pcp-client-javascript-sdk');
  const create = vi.spyOn(PCPGooglePayExpress, 'create');
  await import('./express');
  await vi.waitFor(() => expect(document.querySelector('#status')?.textContent).toContain('paid'));
  expect(fetch.mock.calls[0][1].method).toBe('GET');
  expect(create).not.toHaveBeenCalled();
});
