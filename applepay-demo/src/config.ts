/** Public demo settings. Apple certificates and PAYONE credentials belong on the server. */
const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL?.trim();
const validateMerchantUrl = import.meta.env.VITE_VALIDATE_MERCHANT_URL?.trim();
const merchantName = import.meta.env.VITE_APPLE_MERCHANT_NAME?.trim();
const buttonLocale = import.meta.env.VITE_APPLE_BUTTON_LOCALE?.trim();

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name} in .env.local.`);
  }
  return value;
}

export class ConfigService {
  public readonly backendUrl = required('VITE_BACKEND_BASE_URL', backendUrl);
  public readonly validateMerchantUrl = required('VITE_VALIDATE_MERCHANT_URL', validateMerchantUrl);
  public readonly merchantName = required('VITE_APPLE_MERCHANT_NAME', merchantName);
  public readonly buttonLocale = required('VITE_APPLE_BUTTON_LOCALE', buttonLocale);

  constructor() {
    const url = new URL(this.validateMerchantUrl);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) {
      throw new Error(
        'VITE_VALIDATE_MERCHANT_URL must be an HTTP(S) URL without credentials or fragment.',
      );
    }
  }
}
