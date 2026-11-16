/** Apple encrypted fields are preserved; backend authorization is not capture. */
import { expect, it } from 'vitest';
import { appleInput, appleContact, mapCreated, mapCheckout } from './utils';

it('maps EC_v1 components without re-encoding and rejects unsupported tokens', () => {
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
  expect(appleInput(payment, 'https://shop.test/')).toMatchObject({
    paymentProductId: 302,
    authorizationMode: 'SALE',
    encryptedPaymentData: 'encrypted',
    ephemeralKey: 'ephemeral',
    paymentProduct302SpecificInput: {
      integrationType: 'MERCHANT_CERTIFICATE',
      network: 'VISA',
      token: { signature: 'signature', version: 'EC_V1', header: { transactionId: 'transaction' } },
    },
  });
  payment.token.paymentMethod.network = 'Amex';
  expect(() => appleInput(payment, 'https://shop.test/')).toThrow('Unsupported');
  expect(appleContact({ countryCode: 'de', addressLines: ['Test 1', 'Floor 2'] })).toMatchObject({
    countryCode: 'DE',
    street: 'Test 1',
    additionalInfo: 'Floor 2',
  });
});

it('keeps authorization pending and uses checkout-level completion', () => {
  expect(
    mapCreated({ checkout: { paymentResponse: { payment: { status: 'PENDING_CAPTURE' } } } }, 201)
      .status,
  ).toBe('pending');
  expect(mapCreated({ checkout: { errorResponse: {} } }, 200).status).toBe('failed');
  expect(mapCreated({}, 202).status).toBe('failed');
  expect(
    mapCheckout({ paymentExecutions: [{ events: [{ paymentStatus: 'CAPTURED' }] }] }, {}).status,
  ).toBe('pending');
  expect(mapCheckout({ statusOutput: { paymentStatus: 'PAYMENT_COMPLETED' } }, {}).status).toBe(
    'succeeded',
  );
});
