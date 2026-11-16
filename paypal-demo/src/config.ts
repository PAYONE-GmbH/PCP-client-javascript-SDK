/** Public demo settings. PAYONE credentials and merchant routing belong on the server. */
const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL?.trim();
const shippingOptionId = import.meta.env.VITE_SHIPPING_OPTION?.trim();
const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID?.trim();
const merchantId = import.meta.env.VITE_PAYPAL_MERCHANT_ID?.trim();
const intent = import.meta.env.VITE_PAYPAL_INTENT?.trim();
const locale = import.meta.env.VITE_PAYPAL_LOCALE?.trim();

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name} in .env.local.`);
  }
  return value;
}

export class ConfigService {
  public readonly backendUrl = required('VITE_BACKEND_BASE_URL', backendUrl);
  public readonly shippingOptionId = required('VITE_SHIPPING_OPTION', shippingOptionId);

  constructor() {
    if (this.shippingOptionId !== 'standard' && this.shippingOptionId !== 'express') {
      throw new Error('VITE_SHIPPING_OPTION must be standard or express.');
    }
  }

  // SDK-only settings are validated when the SDK page accesses them.
  get clientId(): string {
    return required('VITE_PAYPAL_CLIENT_ID', clientId);
  }

  get merchantId(): string {
    return required('VITE_PAYPAL_MERCHANT_ID', merchantId);
  }

  get intent(): 'capture' | 'authorize' {
    const value = required('VITE_PAYPAL_INTENT', intent);
    if (value !== 'capture' && value !== 'authorize') {
      throw new Error('VITE_PAYPAL_INTENT must be capture or authorize.');
    }
    return value;
  }

  get locale(): string {
    return required('VITE_PAYPAL_LOCALE', locale);
  }
}
