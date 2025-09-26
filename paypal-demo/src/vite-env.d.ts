/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAYPAL_CLIENT_ID: string;
  readonly VITE_PAYPAL_MERCHANT_ID: string;
  readonly VITE_CREATE_ORDER_URL: string;
  readonly VITE_ON_APPROVE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
