/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPLE_PAY_VALIDATE_MERCHANT_URL: string;
  readonly VITE_APPLE_PAY_PROCESS_PAYMENT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
