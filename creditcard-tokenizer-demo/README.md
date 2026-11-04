# Credit Card Tokenizer Demo

Standalone browser example using the public `PCPCreditCardTokenizer` export and PAYONE Hosted Tokenization SDK 1.6.0. It creates a card token; it does not place an order or take a payment.

## Run locally

From the repository root, use the Node version in `.nvmrc`:

```sh
npm ci
npm run build
npm --prefix creditcard-tokenizer-demo ci
npm --prefix creditcard-tokenizer-demo run dev
```

Open the Vite URL, enter a fresh tokenization JWT issued by your own backend, select its matching test/live environment, and choose **Initialize card form**. Enter test card data in the hosted iframe and choose **Tokenize card**. The result appears on the page as text, including the token for your backend and the vendor's truncated card details. Errors appear in the same output. No JWT or result is persisted or written to the console.

The JWT endpoint belongs to your backend integration. Merchant authentication credentials must stay there. Replace the JWT form with your application's authenticated backend call when integrating this example. An expired JWT requires a new JWT and reinitialization. Reload the page before switching between test and live SDKs.

`src/main.ts` contains UI/text customization and disabled-by-default Click to Pay configuration. Enable CTP only after PAYONE onboarding. Omit `schemeConfig` to let the vendor retrieve it; placeholders are not required. Security-code masking is enabled. The wrapper reports vendor rendering/readiness events through optional `paymentPageCallback`; initialization alone is not proof of a successful tokenization.

The demo destroys the old wrapper before reinitialization and removes the previous iframe. Page exit also detaches its handler. `destroy()` does not unload or reset the vendor singleton.

## Build and host

```sh
npm --prefix creditcard-tokenizer-demo run build
```

Serve the generated `dist/` directory from your own web host. Allow the selected PAYONE tokenization SDK and hosted iframe origins in your site's CSP and network configuration. A real tokenization test requires a valid merchant JWT and reachable PAYONE services.
