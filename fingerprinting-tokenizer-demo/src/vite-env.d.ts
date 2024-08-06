/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAYLA_PARTNER_ID: string;
  readonly VITE_PARTNER_MERCHANT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
