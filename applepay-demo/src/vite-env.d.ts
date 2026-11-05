/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_BASE_URL?: string;
  readonly VITE_VALIDATE_MERCHANT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
