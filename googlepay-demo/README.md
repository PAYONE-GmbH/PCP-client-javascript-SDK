# Google Pay — Standard and Express Checkout

Two small, framework-free demos:

- **[Standard](STANDARD_CHECKOUT.md)** (`index.html`): contact/shipping form, then Google's official payment button.
- **[Express](EXPRESS_CHECKOUT.md)** (`express.html`): Google Pay collects contacts and shipping through the public PAYONE SDK.

## Run locally

Use the Node version in the root `.nvmrc`. From the repository root:

```bash
npm ci
npm run build
npm --prefix googlepay-demo ci
cp googlepay-demo/.env.example googlepay-demo/.env.local
# Configure your merchant backend URL and public Google/PAYONE IDs.
npm --prefix googlepay-demo run dev
```

Open the printed Vite URL. A merchant payment server is required; none is bundled. Google Pay needs a supported browser/account/card and a secure context (localhost where supported, otherwise HTTPS).

## Code

| File | Purpose |
| --- | --- |
| `src/main.ts` | Entire Standard flow: form snapshot, complete Google request, Commerce payload and result |
| `src/express.ts` | Entire Express flow: complete SDK request, shipping updates, Commerce payload and result |
| `src/config.ts` | Read and validate public environment settings; throw for missing required values |
| `src/api/commerce-api.service.ts` | Perform typed POST/GET using the constructor's backend URL; adapt routes/authentication here |
| `src/utils.ts` | Small token/contact conversion, response mapping and text/redirect helpers |
| `src/style.css` | Shared presentation |

There are no local checkout factories, request builders or options interfaces. Express uses `PCPGooglePayExpress` directly; Standard uses `@google-pay/button-element`. SDK/Google types describe their actual requests. Tests live beside the code they verify.

## Public configuration

Set `.env.local` from `.env.example`. Restart Vite after editing. Settings are constants in `src/config.ts`, validated by the `ConfigService` constructor and exposed as readonly properties. Each entry passes the backend URL to the API constructor. Missing or blank required values produce a named error. There are no configuration query overrides or implicit defaults.

| Setting | Environment variable |
| --- | --- |
| `backendUrl` | `VITE_BACKEND_BASE_URL` |
| `environment` | `VITE_GOOGLE_ENVIRONMENT` (`TEST` or `PRODUCTION`, required) |
| `gatewayMerchantId` | `VITE_GOOGLE_GATEWAY_MERCHANT_ID` (required PAYONE gateway ID) |
| `merchantId` | `VITE_GOOGLE_MERCHANT_ID` (separate Google ID, required in production) |
| `merchantName` | `VITE_GOOGLE_MERCHANT_NAME` |
| `buttonLocale` | `VITE_GOOGLE_BUTTON_LOCALE` |
| `allowedAuthMethods` | `VITE_GOOGLE_ALLOWED_AUTH_METHODS` (required; e.g. `CRYPTOGRAM_3DS`) |

All listed environment values are required except `VITE_GOOGLE_MERCHANT_ID` in TEST. The base URL must be absolute HTTP(S), before `commerce-cases`, without credentials/query/fragment. All configuration is public browser data.

Prices are deliberately visible in each entry: Germany/EUR, €19.90 item and €4.90/€9.90 shipping, totals €24.80/€29.80 including tax. Adapt these values and cart lines together; your server validates authoritative prices.

## Merchant backend contract

Relative to `backendUrl`, the API service calls:

```text
POST commerce-cases
GET  commerce-cases/{commerceCaseId}/checkouts/{checkoutId}
```

Your server authenticates to PAYONE and returns its Commerce-compatible body/status. The browser client uses JSON, `credentials: 'omit'`, a 20-second timeout and no automatic POST retries. Adapt headers/credentials for your server; allow JSON preflight if cross-origin. Keep PAYONE credentials server-side and enforce checkout idempotency there.

Each entry visibly builds the sample Commerce order: customer, shipping, matching amount/cart, merchant reference, `autoExecuteOrder: true`, `FULL` order and product **320**, authorization mode **SALE**. `googleInput()` UTF-8/Base64 encodes the original Google token exactly once. The server forwards that encoded field unchanged. Standard uses its confirmed form; Express uses final wallet contacts, never redacted intermediate addresses.

### Payment status and 3DS

- POST error responses, HTTP 202 and rejected/cancelled payment states map to `failed`.
- A redirect maps to `requires-action`; the wallet closes before issuer navigation.
- `CAPTURED` maps to `succeeded`; other successful POST states remain `pending`.
- GET `statusOutput.paymentStatus === 'PAYMENT_COMPLETED'` establishes checkout success; recent rejected/cancelled events map to failure.

Google `SUCCESS` closes its sheet; it is not proof of capture. Backend/PAYONE webhooks determine fulfillment. Google callbacks must finish within 30 seconds.

Each demo stores a marker before POST, then only checkout IDs after a response. This blocks another submission on reload and keeps a lost-response attempt blocked. **Check payment status** performs GET. 3DS returns to the same page/tab and checks the original checkout without reopening the wallet. Return URLs must fit PAYONE's 200-character limit. Tokens/contacts are not stored.

For another test order, first reconcile the existing payment in your backend, then clear that demo's `google:standard:<backend-url>` or `google:express:<backend-url>` session-storage entry. Clearing browser state does not cancel/refund a payment.

## Verification

```bash
npx vitest run googlepay-demo/src/ src/tests/express-checkout.spec.ts
npm run build
npm --prefix googlepay-demo run build
```

## Setup issues

- On desktop, an explicit account-card TEST may need `VITE_GOOGLE_ALLOWED_AUTH_METHODS=PAN_ONLY,CRYPTOGRAM_3DS`. Confirm PAYONE supports those methods for your merchant.
- Error **1201** means payment product configuration was rejected; ask PAYONE to check product 320, gateway ID and merchant/environment configuration. A created Commerce Case alone is not a payment success.
- Google `pay.js` loads as a classic script without `crossorigin`. After SDK edits rebuild the root SDK and restart Vite with `--force`; the demo uses the built SDK in `dist`.
- Production requires PAYONE configuration and Google merchant/domain approval; embedded pages require payment permission.

References: [PAYONE Express](https://docs.commerce.payone.com/docs/payment-methods/google-pay/express-checkout/index.html), [Google Web API](https://developers.google.com/pay/api/web/overview), [test cards](https://developers.google.com/pay/api/web/guides/resources/test-card-suite).
