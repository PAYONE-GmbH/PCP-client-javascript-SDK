import { expect, it } from 'vitest';
import { googleConfig } from './config';

it('uses TEST defaults and keeps PAYONE and Google merchant IDs separate', () => {
  expect(
    googleConfig('https://shop.test/', { VITE_GOOGLE_GATEWAY_MERCHANT_ID: 'P1_test' }),
  ).toEqual({
    environment: 'TEST',
    gatewayMerchantId: 'P1_test',
    merchantId: undefined,
    merchantName: 'PAYONE demo',
    buttonLocale: 'de',
    allowedAuthMethods: ['CRYPTOGRAM_3DS'],
  });
});

it('accepts explicit card-on-file testing through env or URL without changing the default', () => {
  const env = {
    VITE_GOOGLE_GATEWAY_MERCHANT_ID: 'P1_test',
    VITE_GOOGLE_ALLOWED_AUTH_METHODS: ' PAN_ONLY, CRYPTOGRAM_3DS, PAN_ONLY ',
  };
  expect(googleConfig('https://shop.test/', env).allowedAuthMethods).toEqual([
    'PAN_ONLY',
    'CRYPTOGRAM_3DS',
  ]);
  expect(
    googleConfig('https://shop.test/?allowedAuthMethods=CRYPTOGRAM_3DS', env).allowedAuthMethods,
  ).toEqual(['CRYPTOGRAM_3DS']);
  for (const value of ['', 'UNKNOWN', 'PAN_ONLY,']) {
    expect(() => googleConfig(`https://shop.test/?allowedAuthMethods=${value}`, env)).toThrow(
      'allowedAuthMethods',
    );
  }
});

it('allows explicit URL parameters to override Vite defaults', () => {
  expect(
    googleConfig(
      'https://shop.test/?environment=PRODUCTION&gatewayMerchantId=P1_live&merchantId=google-live&merchantName=Shop&buttonLocale=en',
      {
        VITE_GOOGLE_GATEWAY_MERCHANT_ID: 'P1_test',
        VITE_GOOGLE_ENVIRONMENT: 'TEST',
      },
    ),
  ).toMatchObject({
    environment: 'PRODUCTION',
    gatewayMerchantId: 'P1_live',
    merchantId: 'google-live',
    merchantName: 'Shop',
    buttonLocale: 'en',
  });
});

it('rejects invalid or missing merchant configuration before opening a wallet', () => {
  expect(() => googleConfig('https://shop.test/', {})).toThrow('gatewayMerchantId');
  expect(() => googleConfig('https://shop.test/?environment=live', {})).toThrow(
    'TEST or PRODUCTION',
  );
  expect(() =>
    googleConfig('https://shop.test/?environment=PRODUCTION&gatewayMerchantId=P1_live', {}),
  ).toThrow('Google merchantId');
});
