# PayPal checkout demos

Three explicit TypeScript examples use PAYONE payment product **840**:

| Page | Flow | Source |
| --- | --- | --- |
| `/` | Shop contact → PAYONE order → PayPal redirect | [`src/main.ts`](src/main.ts) |
| `/sdk.html` | Shop contact → official PayPal button → PAYONE order → completion | [`src/sdk.ts`](src/sdk.ts) |
| `/express.html` | PayPal address selection → shop review → linked PAYONE order | [`src/express.ts`](src/express.ts) |

## Run

Use Node 26. From the repository root:

```bash
npm ci
npm run build
npm --prefix paypal-demo ci
cp paypal-demo/.env.example paypal-demo/.env.local
npm --prefix paypal-demo run dev
```

Set `.env.local` before starting Vite. Open `http://localhost:5174/`, `/sdk.html` or `/express.html`. Restart Vite after changing configuration. After changing the client SDK, rebuild it and restart Vite with `--force`.

## Configuration

`src/config.ts` reads environment variables and reports missing settings by name. There are no URL overrides or implicit defaults.

| Variable | Required | Meaning |
| --- | --- | --- |
| `VITE_BACKEND_BASE_URL` | All pages | Merchant backend API prefix, e.g. `http://localhost:3000/api/` |
| `VITE_SHIPPING_OPTION` | All pages | Initial `standard` or `express` shipping |
| `VITE_PAYPAL_CLIENT_ID` | SDK page | Public PAYONE-provided PayPal SDK client ID |
| `VITE_PAYPAL_MERCHANT_ID` | SDK page | Matching PayPal merchant account ID |
| `VITE_PAYPAL_INTENT` | SDK page | `capture` or `authorize` |
| `VITE_PAYPAL_LOCALE` | SDK page | For example `de_DE` |

The example includes public sandbox SDK identifiers. Live checkout requires the PAYONE-provided live client ID and matching PayPal merchant account. These IDs are separate from the PAYONE merchant configured on the backend. PAYONE credentials and test/live routing belong on that server. Use a matching PayPal buyer account.

## Code structure

- `src/main.ts`, `src/sdk.ts`, `src/express.ts`: complete flows with visible requests, sample cart, attempt guards and lifecycle handlers. Start reading here.
- `src/config.ts`: `ConfigService`; access settings through `config.…`.
- `src/api/commerce-api.service.ts`: typed HTTP calls, explicit backend URL in the constructor, structured HTTP/network/response errors.
- `src/utils.ts`: small form, payment-result and display helpers.
- `src/style.css`: shared layout.
- Tests sit beside the corresponding source files.

The example item costs €19.90; shipping costs €4.90 or €9.90. Totals are €24.80 or €29.80, including tax. Each flow shows its cart directly and uses integer cents. Adapt these sample prices and validate amounts/address data on your merchant backend.

## Backend

The API service calls an existing merchant server and expects unchanged PAYONE response shapes:

| Request below the configured API prefix | Used by |
| --- | --- |
| `POST commerce-cases` | All pages |
| `GET commerce-cases/{caseId}/checkouts/{checkoutId}` | All pages |
| `POST commerce-cases/{caseId}/checkouts/{checkoutId}/complete-order` | SDK |
| `POST payment-intents` | Express |
| `GET payment-intents/{intentId}` | Express |

The server forwards these operations using its PAYONE credentials. CommerceCase creation returns `commerceCaseId` and nested `checkout.checkoutId`. Intent creation wraps its output in `paymentIntentOutput`; intent GET returns the output unwrapped. SDK creation additionally returns `paymentOutput.redirectPaymentMethodSpecificOutput.payPalTransactionId`.

Ordinary requests use a 20-second timeout, JSON and `credentials: 'omit'`. Configure development CORS for the demo origin, GET/POST/OPTIONS and Content-Type. Adapt the API service if your backend uses cookies or bearer authentication.

## Payment state and recovery

The return URL is the current origin/path plus `?returned=1` (maximum 200 characters). Configuration comes from `.env.local`; return parameters are not payment proof.

All pages share `paypal:order:{normalizedBackendUrl}` in `sessionStorage`. A marker is saved **before** order creation; response IDs are saved afterwards. SDK completion has its own persisted marker. Express also persists intent IDs and phase. Addresses and account email are not stored there.

No POST is retried automatically. After an uncertain response or reload, “Check payment status” reads the saved checkout. If IDs are missing, reconcile the attempt in your backend. For another deliberate test, reconcile first, then clear the exact demo keys in browser developer tools. Session storage is a same-tab demo guard; server-side idempotency remains a backend concern.

Only intent GET retries temporary network errors, HTTP 404/409/503 or incomplete address data, every 200 ms within two seconds. Local Express cancellation is available before confirmation and clears the review context; it does not cancel a payment at PayPal.

Captured payment or checkout `PAYMENT_COMPLETED` is success. Authorization alone is pending. Nested payment errors, HTTP 202 and rejected/cancelled states are failure. Popup approval and returning from PayPal are not payment success. Process PAYONE capture webhooks on the backend.

## Checks

```bash
npx vitest run paypal-demo/src src/tests/express-checkout.spec.ts
npm --prefix paypal-demo run build
npm run lint
npm run format:check
```

Flow details: [Standard](STANDARD_CHECKOUT.md), [SDK](SDK_CHECKOUT.md), [Express](EXPRESS_CHECKOUT.md).
