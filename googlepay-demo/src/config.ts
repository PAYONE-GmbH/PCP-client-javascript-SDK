export interface GoogleConfig {
  environment: google.payments.api.Environment;
  gatewayMerchantId: string;
  merchantId?: string;
  merchantName: string;
  buttonLocale: string;
  allowedAuthMethods?: google.payments.api.CardAuthMethod[];
}

/** Public Google settings only; query parameters take precedence over Vite defaults. */
export function googleConfig(href: string, env: Record<string, string | undefined>): GoogleConfig {
  const params = new URL(href).searchParams;
  const value = (key: string, envKey: string, fallback = '') =>
    (params.get(key) ?? env[envKey] ?? fallback).trim();
  const environment = value('environment', 'VITE_GOOGLE_ENVIRONMENT', 'TEST');
  if (environment !== 'TEST' && environment !== 'PRODUCTION')
    throw new Error('Google environment must be TEST or PRODUCTION.');
  const gatewayMerchantId = value('gatewayMerchantId', 'VITE_GOOGLE_GATEWAY_MERCHANT_ID');
  if (!gatewayMerchantId)
    throw new Error('Set gatewayMerchantId or VITE_GOOGLE_GATEWAY_MERCHANT_ID to your PAYONE ID.');
  const merchantId = value('merchantId', 'VITE_GOOGLE_MERCHANT_ID') || undefined;
  if (environment === 'PRODUCTION' && !merchantId)
    throw new Error('Google merchantId is required for PRODUCTION (not your PAYONE ID).');
  const merchantName = value('merchantName', 'VITE_GOOGLE_MERCHANT_NAME', 'PAYONE demo');
  if (!merchantName) throw new Error('Google merchantName must not be empty.');
  const allowedAuthMethods = value(
    'allowedAuthMethods',
    'VITE_GOOGLE_ALLOWED_AUTH_METHODS',
    'CRYPTOGRAM_3DS',
  )
    .split(',')
    .map((entry): google.payments.api.CardAuthMethod => {
      const method = entry.trim();
      if (method !== 'PAN_ONLY' && method !== 'CRYPTOGRAM_3DS')
        throw new Error('Google allowedAuthMethods must contain PAN_ONLY and/or CRYPTOGRAM_3DS.');
      return method;
    });
  return {
    environment,
    gatewayMerchantId,
    merchantId,
    merchantName,
    buttonLocale: value('buttonLocale', 'VITE_GOOGLE_BUTTON_LOCALE', 'de'),
    allowedAuthMethods: [...new Set(allowedAuthMethods)],
  };
}
