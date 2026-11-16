/// <reference types="vite/client" />

/** Public settings read by ConfigService; no backend credentials belong here. */
interface ImportMetaEnv {
  readonly VITE_BACKEND_BASE_URL?: string;
  readonly VITE_SHIPPING_OPTION?: string;
  readonly VITE_PAYPAL_CLIENT_ID?: string;
  readonly VITE_PAYPAL_MERCHANT_ID?: string;
  readonly VITE_PAYPAL_INTENT?: string;
  readonly VITE_PAYPAL_LOCALE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
