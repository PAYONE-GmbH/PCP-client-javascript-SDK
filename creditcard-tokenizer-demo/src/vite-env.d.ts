/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAYONE_MERCHANT_ID: string;
  readonly VITE_PAYONE_PORTAL_ID: string;
  readonly VITE_PAYONE_SUBACCOUNT_ID: string;
  readonly VITE_PAYONE_PMI_KEY: string;
  readonly VITE_PAYONE_CC_TYPES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
