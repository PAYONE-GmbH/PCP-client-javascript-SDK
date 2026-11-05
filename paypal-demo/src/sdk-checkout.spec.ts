import { loadScript, type PayPalButtonsComponentOptions } from '@paypal/paypal-js';
import { afterEach, expect, it, vi } from 'vitest';
import { createSdkCheckout } from './sdk-checkout';

vi.mock('@paypal/paypal-js', () => ({ loadScript: vi.fn() }));
afterEach(() => {
  document.body.replaceChildren();
  vi.resetAllMocks();
});

const contact = () => ({
  customer: { contactDetails: { emailAddress: 'ada@example.test' } },
  shippingAddress: {
    countryCode: 'DE',
    city: 'Berlin',
    street: 'Test 1',
    zip: '10115',
    name: { firstName: 'Ada', surname: 'Example' },
  },
});
const order = {
  commerceCaseId: 'case',
  checkoutId: 'checkout',
  paymentId: 'payone-payment',
  orderId: 'PAYPAL-ORDER',
};
async function setup(intent: 'capture' | 'authorize' = 'capture') {
  document.body.innerHTML = '<div id="paypal"></div>';
  let callbacks!: PayPalButtonsComponentOptions;
  const button = {
    render: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    isEligible: () => true,
  };
  vi.mocked(loadScript).mockResolvedValue({
    Buttons: (options: PayPalButtonsComponentOptions) => {
      callbacks = options;
      return button;
    },
    FUNDING: { PAYPAL: 'paypal' },
  } as any);
  const options = {
    clientId: 'sdk-client',
    merchantId: 'sdk-merchant',
    intent,
    locale: 'de_DE',
    selector: '#paypal',
    returnUrl: 'https://demo.test/sdk.html',
    createOrder: vi.fn().mockResolvedValue(order),
    completeOrder: vi.fn().mockResolvedValue({ status: 'pending', paymentId: 'payone-payment' }),
    onResult: vi.fn(),
    onCancel: vi.fn(),
    onError: vi.fn(),
  };
  const snapshot = contact();
  const checkout = await createSdkCheckout(options, snapshot, 'express');
  return { callbacks, options, button, snapshot, checkout };
}
const create = (callbacks: PayPalButtonsComponentOptions) =>
  callbacks.createOrder!({} as any, {} as any);
const approve = (callbacks: PayPalButtonsComponentOptions, orderID = order.orderId) =>
  callbacks.onApprove!({ orderID }, {} as any);

it.each(['capture', 'authorize'] as const)(
  'uses a frozen merchant snapshot, one PAYONE order and matching %s intent',
  async (intent) => {
    const { callbacks, options, snapshot } = await setup(intent);
    expect(loadScript).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'sdk-client',
        merchantId: 'sdk-merchant',
        intent,
        currency: 'EUR',
        commit: true,
        vault: false,
      }),
    );
    snapshot.shippingAddress.city = 'Changed';
    expect(await Promise.all([create(callbacks), create(callbacks)])).toEqual([
      'PAYPAL-ORDER',
      'PAYPAL-ORDER',
    ]);
    expect(options.createOrder).toHaveBeenCalledOnce();
    expect(options.createOrder.mock.calls[0]).toEqual([
      {
        redirectPaymentMethodSpecificInput: expect.objectContaining({
          paymentProductId: 840,
          requiresApproval: intent === 'authorize',
          paymentProduct840SpecificInput: {
            addressSelectionAtPayPal: false,
            javaScriptSdkFlow: true,
          },
        }),
      },
      expect.objectContaining({ shippingAddress: expect.objectContaining({ city: 'Berlin' }) }),
      'express',
    ]);
  },
);

it('completes approval through PAYONE once and reports the backend state, not browser approval as success', async () => {
  const { callbacks, options } = await setup();
  await create(callbacks);
  await Promise.all([approve(callbacks), approve(callbacks)]);
  expect(options.completeOrder).toHaveBeenCalledExactlyOnceWith(order);
  expect(options.onResult).toHaveBeenCalledExactlyOnceWith({
    status: 'pending',
    paymentId: 'payone-payment',
  });
  await expect(create(callbacks)).rejects.toThrow('closed');
});

it.each(['cancel', 'error'] as const)(
  'propagates %s for a known order without retrying completion',
  async (kind) => {
    const { callbacks, options } = await setup();
    await create(callbacks);
    if (kind === 'cancel') await callbacks.onCancel!({ orderID: order.orderId }, {} as any);
    else {
      callbacks.onError!({ message: 'popup failed' });
      await vi.waitFor(() => expect(options.completeOrder).toHaveBeenCalledOnce());
    }
    await approve(callbacks);
    expect(options.completeOrder).toHaveBeenCalledOnce();
    if (kind === 'cancel')
      expect(options.onCancel).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
    else
      expect(options.onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'popup failed' }),
      );
  },
);

it('does not complete without an order, and rejects mismatched callback IDs', async () => {
  const { callbacks, options } = await setup();
  callbacks.onError!({ message: 'SDK failed before createOrder' });
  expect(options.completeOrder).not.toHaveBeenCalled();
  await create(callbacks);
  await expect(approve(callbacks, 'OTHER')).rejects.toThrow('mismatch');
  expect(options.completeOrder).not.toHaveBeenCalled();
});

it('keeps uncertain creation and completion failures single-shot', async () => {
  const first = await setup();
  first.options.createOrder.mockRejectedValue(new Error('creation timeout'));
  await expect(create(first.callbacks)).rejects.toThrow('creation timeout');
  await expect(create(first.callbacks)).rejects.toThrow('creation timeout');
  expect(first.options.createOrder).toHaveBeenCalledOnce();
  const second = await setup();
  await create(second.callbacks);
  second.options.completeOrder.mockRejectedValue(new Error('completion timeout'));
  await expect(approve(second.callbacks)).rejects.toThrow('completion timeout');
  await approve(second.callbacks);
  expect(second.options.completeOrder).toHaveBeenCalledOnce();
  expect(second.options.onResult).not.toHaveBeenCalled();
});

it('closes its button and ignores late callbacks after destroy', async () => {
  const { callbacks, checkout, options, button } = await setup();
  await create(callbacks);
  await checkout.destroy();
  await approve(callbacks);
  callbacks.onError!({ message: 'late' });
  expect(button.close).toHaveBeenCalledOnce();
  expect(options.completeOrder).not.toHaveBeenCalled();
  expect(options.onResult).not.toHaveBeenCalled();
  expect(options.onError).not.toHaveBeenCalled();
});
