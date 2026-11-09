# Apple Pay checkout demos

Two direct TypeScript examples use `PCPApplePaySession` and PAYONE product **302**, SALE and merchant certificates:

| Page | Contact and shipping | Source |
| --- | --- | --- |
| `/index.html` | Merchant form, fixed before opening Apple Pay | [`src/main.ts`](src/main.ts) |
| `/express.html` | Collected and selected inside Apple Pay | [`src/express.ts`](src/express.ts) |

## Run

Use Node 26. From the repository root:

```bash
npm ci
npm run build
npm --prefix applepay-demo ci
cp applepay-demo/.env.example applepay-demo/.env.local
npm --prefix applepay-demo run dev
```

Set the required values in `.env.local` before starting Vite. Open the origin printed by Vite and choose either page. Restart Vite after changing configuration. After changing SDK source, rebuild the root SDK and restart Vite with `--force`.

Real payments require a supported Apple Pay browser/device and wallet, a registered merchant domain, merchant-validation service and PAYONE merchant configured for Apple Pay. See [Apple server setup](https://developer.apple.com/documentation/apple_pay_on_the_web/setting_up_your_server) and [PAYONE Apple Pay setup](https://docs.commerce.payone.com/docs/payment-methods/apple-pay/apple-setup).

## Configuration

`ConfigService` reads and validates these required settings; missing values throw a named error. There are no URL overrides or implicit defaults.

| Variable | Meaning |
| --- | --- |
| `VITE_BACKEND_BASE_URL` | Merchant backend API prefix, e.g. `https://api.example/api/` |
| `VITE_VALIDATE_MERCHANT_URL` | Existing Apple merchant-validation endpoint |
| `VITE_APPLE_MERCHANT_NAME` | Label of the wallet total |
| `VITE_APPLE_BUTTON_LOCALE` | Button locale, e.g. `de-DE` |

All `VITE_` values are public. Apple certificates/private keys and PAYONE API credentials belong on the server. Test/live routing is configured there.

## Structure

- `src/main.ts`, `src/express.ts`: complete flows, visible Apple requests and sample CommerceCase payloads, submission guards and cleanup.
- `src/config.ts`: `ConfigService`, accessed through `config.…`.
- `src/api/commerce-api.service.ts`: typed HTTP calls with an explicit backend URL, 20-second timeout and structured errors.
- `src/utils.ts`: Apple token/contact mapping and payment-result display.
- `src/style.css`: shared layout.
- Tests sit beside the source they exercise.

Each flow shows the demo cart directly: €19.90 item plus €4.90 or €9.90 shipping, totals €24.80/€29.80 including tax. Backend amounts use integer cents. Validate prices and addresses against your merchant backend's own catalogue.

## Backend contracts

The demo calls your existing merchant server:

| Request | Expected response |
| --- | --- |
| `POST {backendBaseUrl}commerce-cases` | PAYONE JSON with `commerceCaseId`, nested `checkout.checkoutId` and payment result |
| `GET {backendBaseUrl}commerce-cases/{caseId}/checkouts/{checkoutId}` | PAYONE checkout JSON |
| `POST {validateMerchantUrl}` | Apple merchant session JSON |

Merchant validation is performed by `PCPApplePaySession`: it sends `{ "validationURL": "…" }` to your endpoint, which obtains the Apple merchant session using server-side certificates. Return that session object directly. The payment request uses `processPaymentCallback`; there is no additional process-payment endpoint.

The Commerce API client uses JSON and `credentials: 'omit'`. Configure CORS for the frontend origin and Content-Type; adapt headers/credentials if your server requires authentication.

Apple encrypted token components are already Base64 and remain unchanged. The mapper accepts EC_v1 and Visa/Mastercard/girocard, sends product 302 with `MERCHANT_CERTIFICATE`, and includes the short 3DS return URL.

## Recovery and lifecycle

Both pages share `express:apple:{normalizedBackendUrl}:backend-managed` in `sessionStorage`. A marker is saved **before** POST, then replaced with response IDs. Tokens and contacts are not stored. No POST is automatically retried; after an uncertain response or reload, “Check payment status” reads the existing checkout. Missing IDs require backend reconciliation.

The return URL is the current origin/path plus `?returned=1`, at most 200 characters. Return parameters alone are not payment proof. Captured payment or checkout `PAYMENT_COMPLETED` is success; authorization alone stays pending. Nested payment errors, HTTP 202 and rejected/cancelled statuses are failure. Process asynchronous capture webhooks on the backend.

For another deliberate test, reconcile the previous attempt first, then clear its exact storage key. The same-tab marker is a demo guard; server-side idempotency remains a backend responsibility.

Standard “Edit” destroys the old button and invalidates its callbacks before changing contact/shipping. Both pages destroy the button on `pagehide`, including initialization that finishes after navigation, and suppress late UI callbacks.

## Build and checks

```bash
npx vitest run applepay-demo/src src/tests/PCPApplePaySession.spec.ts src/tests/express-checkout.spec.ts
npm --prefix applepay-demo run build
npm run lint
npm run format:check
```

Serve the contents of `applepay-demo/dist/` on your registered HTTPS origin, preserving both HTML pages and `assets/`. For a path prefix, build with `--base=/checkout/`.

Flow details: [Standard](STANDARD_CHECKOUT.md), [Express](EXPRESS_CHECKOUT.md).
