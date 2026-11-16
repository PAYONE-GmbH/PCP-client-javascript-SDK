/// <reference types="vite/client" />

/** Public settings validated by ConfigService. */
interface ImportMetaEnv {
  readonly VITE_BACKEND_BASE_URL?: string;
  readonly VITE_VALIDATE_MERCHANT_URL?: string;
  readonly VITE_APPLE_MERCHANT_NAME?: string;
  readonly VITE_APPLE_BUTTON_LOCALE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
