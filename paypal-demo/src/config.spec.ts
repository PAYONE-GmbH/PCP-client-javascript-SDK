import { expect, it } from 'vitest';
import { paypalConfig } from './config';

const env = { VITE_PAYPAL_CLIENT_ID: 'client', VITE_PAYPAL_MERCHANT_ID: 'merchant' };
it('requires public SDK IDs, with capture and German locale defaults', () => {
  expect(paypalConfig('https://demo.test/sdk.html', env)).toEqual({
    clientId: 'client',
    merchantId: 'merchant',
    intent: 'capture',
    locale: 'de_DE',
  });
  expect(() => paypalConfig('https://demo.test/', {})).toThrow('clientId and merchantId');
});
it('accepts trimmed URL overrides and rejects mismatched SDK intent configuration', () => {
  expect(
    paypalConfig(
      'https://demo.test/?clientId=other&merchantId=other-merchant&intent=authorize&locale=en_US',
      env,
    ),
  ).toEqual({
    clientId: 'other',
    merchantId: 'other-merchant',
    intent: 'authorize',
    locale: 'en_US',
  });
  expect(() => paypalConfig('https://demo.test/?intent=sale', env)).toThrow('capture or authorize');
  expect(() => paypalConfig('https://demo.test/?clientId=', env)).toThrow(
    'clientId and merchantId',
  );
});
