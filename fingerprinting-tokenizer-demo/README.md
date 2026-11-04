# Fingerprinting Tokenizer Demo

Standalone browser example using the public `PCPFingerprintingTokenizer` export. It initializes Payla device collection and displays the session ID and matching device token for your backend. It does not submit a payment.

## Run locally

From the repository root, use the Node version in `.nvmrc`:

```sh
npm ci
npm run build
npm --prefix fingerprinting-tokenizer-demo ci
npm --prefix fingerprinting-tokenizer-demo run dev
```

Open the Vite URL and enter your PAYONE/Payla partner ID, partner merchant ID, and environment (`t` test or `p` production). An optional session ID identifies the checkout; leaving it blank generates a UUIDv4. Choose **Initialize fingerprinting**. Initialization errors are shown on the page.

Optional `VITE_PAYLA_PARTNER_ID` and `VITE_PARTNER_MERCHANT_ID` values prefill the form (see `.env.example`). These are public snippet identifiers, not backend API credentials. Values entered into the form take precedence. The demo does not persist or console-log the resulting device token.

Pass the displayed `deviceToken` to your backend for the same checkout attempt and use it as `paymentMethodSpecificInput.customerDevice.deviceToken` in the corresponding PAYONE BNPL input. Keep the session stable for that attempt. Successful initialization means the resources loaded and vendor initialization ran, not that a payment was authorized or asynchronous device collection has completed.

Starting again destroys the previous session stylesheet, initializes the new token and reuses the vendor script. Only one session may be active per document. Reload to switch partner/merchant identifiers because the loaded script is merchant-specific. Page exit releases the session stylesheet; vendor-created internals are not controlled by this wrapper.

## Build and host

```sh
npm --prefix fingerprinting-tokenizer-demo run build
```

Serve `dist/` from your web host and allow `https://d.payla.io` scripts/styles in your site's network/CSP configuration. Real device collection requires valid identifiers and access to Payla; mocked SDK tests do not prove fraud-service acceptance.
