/** Payment status mapping must not confuse authorization or stale capture events with completion. */
import { expect, it } from 'vitest';
import { mapCheckout, mapCreated } from './utils';

it('maps redirects, downstream rejection and capture separately', () => {
  expect(
    mapCreated(
      {
        checkout: {
          paymentResponse: {
            merchantAction: { redirectData: { redirectURL: 'https://paypal.test/' } },
          },
        },
      },
      201,
    ).status,
  ).toBe('requires-action');
  expect(mapCreated({ checkout: { errorResponse: {} } }, 200).status).toBe('failed');
  expect(mapCreated({}, 202).status).toBe('failed');
  expect(
    mapCreated({ checkout: { paymentResponse: { payment: { status: 'PENDING_CAPTURE' } } } }, 200)
      .status,
  ).toBe('pending');
  expect(
    mapCreated({ checkout: { paymentResponse: { payment: { status: 'CAPTURED' } } } }, 200).status,
  ).toBe('succeeded');
});

it('uses checkout completion instead of old CAPTURED events', () => {
  expect(
    mapCheckout({ paymentExecutions: [{ events: [{ paymentStatus: 'CAPTURED' }] }] }, {}).status,
  ).toBe('pending');
  expect(
    mapCheckout(
      { statusOutput: { paymentStatus: 'PAYMENT_COMPLETED' } },
      { checkoutId: 'checkout' },
    ),
  ).toMatchObject({ status: 'succeeded', checkoutId: 'checkout' });
  expect(
    mapCheckout({ paymentExecutions: [{ events: [{ paymentStatus: 'CANCELLED' }] }] }, {}).status,
  ).toBe('failed');
});
