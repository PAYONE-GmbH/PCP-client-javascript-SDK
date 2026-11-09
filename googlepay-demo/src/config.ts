/** Public demo settings and validation. Never put server credentials in VITE_ variables. */
const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL?.trim();
const environment = import.meta.env.VITE_GOOGLE_ENVIRONMENT?.trim();
const merchantId = import.meta.env.VITE_GOOGLE_MERCHANT_ID?.trim();
const gatewayMerchantId = import.meta.env.VITE_GOOGLE_GATEWAY_MERCHANT_ID?.trim();
const merchantName = import.meta.env.VITE_GOOGLE_MERCHANT_NAME?.trim();
const buttonLocale = import.meta.env.VITE_GOOGLE_BUTTON_LOCALE?.trim();
const allowedAuthMethods = import.meta.env.VITE_GOOGLE_ALLOWED_AUTH_METHODS?.trim();

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name} in .env.local.`);
  }
  return value;
}

export class ConfigService {
  public readonly backendUrl: string;
  public readonly environment: google.payments.api.Environment;
  public readonly merchantId: string | undefined;
  public readonly gatewayMerchantId: string;
  public readonly merchantName: string;
  public readonly buttonLocale: string;
  public readonly authMethods: google.payments.api.CardAuthMethod[];

  constructor() {
    if (environment !== 'TEST' && environment !== 'PRODUCTION') {
      required('VITE_GOOGLE_ENVIRONMENT', environment);
      throw new Error('VITE_GOOGLE_ENVIRONMENT must be TEST or PRODUCTION.');
    }
    if (environment === 'PRODUCTION' && !merchantId) {
      throw new Error('Missing VITE_GOOGLE_MERCHANT_ID in .env.local (required in PRODUCTION).');
    }
    this.backendUrl = required('VITE_BACKEND_BASE_URL', backendUrl);
    this.environment = environment;
    this.merchantId = merchantId;
    this.gatewayMerchantId = required('VITE_GOOGLE_GATEWAY_MERCHANT_ID', gatewayMerchantId);
    this.merchantName = required('VITE_GOOGLE_MERCHANT_NAME', merchantName);
    this.buttonLocale = required('VITE_GOOGLE_BUTTON_LOCALE', buttonLocale);
    this.authMethods = required('VITE_GOOGLE_ALLOWED_AUTH_METHODS', allowedAuthMethods)
      .split(',')
      .map((method): google.payments.api.CardAuthMethod => {
        const value = method.trim();
        if (value !== 'CRYPTOGRAM_3DS' && value !== 'PAN_ONLY') {
          throw new Error('Unsupported card auth method.');
        }
        return value;
      });
  }
}
