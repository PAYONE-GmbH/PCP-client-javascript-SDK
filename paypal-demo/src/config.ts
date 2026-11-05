export interface PayPalSdkConfig {
  clientId: string;
  merchantId: string;
  intent: 'capture' | 'authorize';
  locale: string;
}

/** Public SDK settings only; environment and PAYONE merchant routing remain server-side. */
export function paypalConfig(
  href: string,
  env: Record<string, string | undefined>,
): PayPalSdkConfig {
  const params = new URL(href).searchParams;
  const value = (query: string, variable: string, fallback = '') =>
    (params.get(query) ?? env[variable] ?? fallback).trim();
  const clientId = value('clientId', 'VITE_PAYPAL_CLIENT_ID');
  const merchantId = value('merchantId', 'VITE_PAYPAL_MERCHANT_ID');
  const intent = value('intent', 'VITE_PAYPAL_INTENT', 'capture');
  if (!clientId || !merchantId)
    throw new Error('Set PayPal clientId and merchantId for the SDK button.');
  if (intent !== 'capture' && intent !== 'authorize')
    throw new Error('PayPal intent must be capture or authorize.');
  return { clientId, merchantId, intent, locale: value('locale', 'VITE_PAYPAL_LOCALE', 'de_DE') };
}
