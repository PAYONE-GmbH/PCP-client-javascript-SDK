/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPLE_PAY_VALIDATE_MERCHANT_URL: string;
  readonly VITE_APPLE_PAY_PROCESS_PAYMENT_URL: string;
  readonly VITE_APPLE_PAY_MERCHANT_IDENTIFIER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
