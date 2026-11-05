# PayPal checkout demos

Three small TypeScript/Vite pages integrate PayPal through the PAYONE Commerce Platform:

| Page | Customer data | Payment sequence |
| --- | --- | --- |
| [Standard Checkout](STANDARD_CHECKOUT.md), `/index.html` | Entered in the shop; billing equals delivery in this example | Create CommerceCase with auto-executed Order → PayPal redirect → checkout status |
| [SDK Checkout](SDK_CHECKOUT.md), `/sdk.html` | Entered in the shop; fixed before rendering the button | PayPal SDK button → CommerceCase/Order → popup approval → Complete Order → checkout status |
| [Express Checkout](EXPRESS_CHECKOUT.md), `/express.html` | Delivery address retrieved from PayPal and explicitly reviewed in the shop | Create PaymentIntent → PayPal redirect → GET intent → review → linked CommerceCase/Order → optional second redirect → checkout status |

All pages use **payment product 840**, EUR, delivery within Germany, no vaulting (`tokenize: false`) and automatic capture by default (`requiresApproval: false`). **Standard and Express** use `javaScriptSdkFlow: false` and require no browser SDK identifiers. **SDK Checkout** uses `javaScriptSdkFlow: true`, loads the official `@paypal/paypal-js` button and requires public SDK client/merchant IDs. Its optional `authorize` mode sets `requiresApproval: true` for subsequent server-side capture.

## Run locally

Use Node 26 and the npm version supported by the repository. From the repository root:

```bash
npm ci
npm run build
npm --prefix paypal-demo ci
cp paypal-demo/.env.example paypal-demo/.env.local
# Set VITE_BACKEND_BASE_URL to your running merchant backend.
npm --prefix paypal-demo run dev
```

- Standard: `http://localhost:5174/`
- SDK: `http://localhost:5174/sdk.html`
- Express: `http://localhost:5174/express.html`
- Build all three pages: `npm --prefix paypal-demo run build`
- Serve the build: `npm --prefix paypal-demo run preview`

The public SDK is a local `file:..` dependency imported from its compiled `dist`. After changing SDK source, run `npm run build` and restart Vite with `npm --prefix paypal-demo run dev -- --force`.

The merchant backend must have PayPal enabled for its PAYONE merchant and select the correct test/live environment. Use a matching PayPal buyer account. Serve a reachable return URL accepted by that environment; use HTTPS for deployed demos. No backend server or credentials are shipped here.

## Configuration

| URL parameter | Environment variable | Default / rules |
| --- | --- | --- |
| `backendUrl` | `VITE_BACKEND_BASE_URL` | Required absolute HTTP(S) API base URL; no username, password, query or fragment. A trailing slash is added. |
| `shipping` | `VITE_SHIPPING_OPTION` | `standard`; alternative `express`. Unknown values are rejected. |
| `clientId` | `VITE_PAYPAL_CLIENT_ID` | Required on SDK page only. Public PayPal SDK client ID. |
| `merchantId` | `VITE_PAYPAL_MERCHANT_ID` | Required on SDK page only. Public PayPal account ID, **not** the PAYONE API merchant path. |
| `intent` | `VITE_PAYPAL_INTENT` | SDK only: `capture` (default, SALE) or `authorize` (separate capture later). |
| `locale` | `VITE_PAYPAL_LOCALE` | SDK only: `de_DE` by default. |

URL values override environment values. On a redirect return, saved configuration restores the original backend and shipping default before environment fallbacks are used. Navigation between all three pages carries the backend, shipping and any explicit public SDK URL parameters forward. SDK configuration is parsed only on the SDK page; missing SDK IDs do not block the redirect pages.

Example:

```text
http://localhost:5174/express.html?backendUrl=http%3A%2F%2Flocalhost%3A3009%2Fapi%2F&shipping=express
```

All `VITE_*` values are public browser configuration. PAYONE API credentials, merchant selection and test/live routing belong on the server. The `.env.example` includes fixed sandbox SDK IDs; live SDK checkout requires the **PAYONE-provided live client ID** and the merchant's matching PayPal account ID, not an arbitrary own-app client ID. A sandbox **buyer** account is used to approve the popup; it is not a replacement for the merchant/account mapping. Public SDK IDs neither configure nor validate the backend's PAYONE merchant. `VITE_CREATE_ORDER_URL` and `VITE_ON_APPROVE_URL` are no longer used: all pages share the Commerce API adapter.

### Demo prices

`src/pricing.ts` contains the deliberately fixed catalogue and shared quote/cart functions:

- One item: **1990 cents / €19.90**.
- Standard shipping: **490 cents / €4.90**, total **2480 cents / €24.80**.
- Express shipping: **990 cents / €9.90**, total **2980 cents / €29.80**.
- All prices include tax. No separate tax amount is added and no quote endpoint is assumed.

The selected shipping option is used consistently in the amount and the `SHIPMENT` cart line. An Express intent starts with the configured initial option; changing it during review may require a new PayPal approval. The backend must validate prices, shipping and permitted customer/address data against its own trusted catalogue. Replace the fixed quote module with your pricing service for a real checkout; do not trust browser totals.

## Modules

| File | Responsibility |
| --- | --- |
| `src/main.ts` | Standard form submission and disabling the form after starting payment |
| `src/sdk.ts` | SDK merchant form, immutable snapshot, button lifecycle and edit-before-order handling |
| `src/sdk-checkout.ts` | Parameterized SDK button factory, PayPal order-ID handoff and single completion for provider callbacks |
| `src/config.ts` | SDK-only public configuration and intent validation |
| `src/express.ts` | Express redirect restoration, editable address review and explicit confirmation |
| `src/checkout.ts` | Parameterized Standard and Express factories; injected submit/read/persistence/navigation callbacks |
| `src/payment.ts` | Shared product-840 input and merchant-form contact mapping |
| `src/pricing.ts` | Fixed demo catalogue, integer-cent quote and cart |
| `src/backend.ts` | Configuration/short return URLs, Commerce API calls, attempt guards and result mapping |
| `src/page.ts` | Shared configuration, navigation, total display and backend wiring |
| `src/ui.ts` | Text-only status/error output, payment redirects and checkout reconciliation |
| `src/style.css` | Shared layout |
| `../src/lib/PCPPayPalExpress.ts` | Public headless redirect state machine; persistence before navigation/confirmation and duplicate-confirmation protection |

## Backend contract

The browser calls your merchant backend, not the authenticated PAYONE API directly. With `backendUrl=http://localhost:3009/api/`, these routes are required:

| Browser request | Server-side PAYONE operation |
| --- | --- |
| `POST /api/commerce-cases` | `POST /v1/{merchantId}/commerce-cases` |
| `GET /api/commerce-cases/{caseId}/checkouts/{checkoutId}` | `GET /v1/{merchantId}/commerce-cases/{caseId}/checkouts/{checkoutId}` |
| `POST /api/commerce-cases/{caseId}/checkouts/{checkoutId}/complete-order` (SDK) | `POST /v1/{merchantId}/commerce-cases/{caseId}/checkouts/{checkoutId}/complete-order` |
| `POST /api/payment-intents` (Express) | `POST /v1/{merchantId}/payment-intents` |
| `GET /api/payment-intents/{paymentIntentId}` (Express) | `GET /v1/{merchantId}/payment-intents/{paymentIntentId}` |

Responses must preserve the PAYONE JSON shapes and downstream error fields. POST intent output is wrapped in `paymentIntentOutput`; GET intent output is **unwrapped**. The adapter expects the CommerceCase POST response to contain `commerceCaseId` and nested `checkout.checkoutId`.

Fetch uses JSON, `credentials: 'omit'`, no Authorization header, and a 20-second timeout for ordinary requests. For cross-origin development the backend must allow the demo origin, `GET`/`POST`/`OPTIONS`, and `Content-Type`. If your application requires cookies or bearer tokens, adapt `CommerceBackend.request` and the intent GET together. The demo does not add anonymous proxy routes to a server.

### Standard order example

The following is the request shape for Standard shipping. The reference is generated per attempt and reused in the checkout and order. All amounts are integer cents.

```json
{
  "customer": {
    "billingAddress": { "countryCode": "DE", "city": "Berlin", "street": "Example Street 1", "zip": "10115" },
    "personalInformation": { "name": { "firstName": "Ada", "surname": "Example" } },
    "contactDetails": { "emailAddress": "ada@example.test" }
  },
  "checkout": {
    "amountOfMoney": { "amount": 2480, "currencyCode": "EUR" },
    "references": { "merchantReference": "unique-attempt-ref" },
    "shipping": { "address": {
      "countryCode": "DE", "city": "Berlin", "street": "Example Street 1", "zip": "10115",
      "name": { "firstName": "Ada", "surname": "Example" }
    } },
    "shoppingCart": { "items": [
      { "orderLineDetails": { "productCode": "PAYPAL-DEMO", "productName": "Demo item", "productType": "GOODS", "productPrice": 1990, "quantity": 1 } },
      { "orderLineDetails": { "productCode": "standard", "productName": "Shipping", "productType": "SHIPMENT", "productPrice": 490, "quantity": 1 } }
    ] },
    "autoExecuteOrder": true,
    "orderRequest": {
      "orderType": "FULL",
      "orderReferences": { "merchantReference": "unique-attempt-ref" },
      "paymentMethodSpecificInput": {
        "redirectPaymentMethodSpecificInput": {
          "paymentProductId": 840,
          "requiresApproval": false,
          "tokenize": false,
          "redirectionData": { "returnUrl": "https://shop.example/index.html?returned=1&context=opaque-id" },
          "paymentProduct840SpecificInput": {
            "addressSelectionAtPayPal": false,
            "javaScriptSdkFlow": false
          }
        }
      }
    }
  }
}
```

Express uses the same final order shape but fills the customer from PayPal, the delivery address from the review form, and adds the original intent's **`paymentId`** to `paymentProduct840SpecificInput`. This is not `paymentIntentId` or `payPalTransactionId`.

### SDK order and completion

The SDK page uses the same merchant contact, cart and CommerceCase payload as Standard, with `javaScriptSdkFlow: true`. `intent=capture` sends `requiresApproval: false`; `intent=authorize` sends `true`. The SDK intent and PAYONE flag are derived from the same setting. The return URL remains supplied and capped at 200 characters even though normal approval uses a popup.

The initial response must additionally contain:

```json
{
  "commerceCaseId": "case-id",
  "checkout": {
    "checkoutId": "checkout-id",
    "paymentResponse": {
      "payment": {
        "id": "payone-payment-id",
        "paymentOutput": {
          "redirectPaymentMethodSpecificOutput": { "payPalTransactionId": "paypal-order-id" }
        }
      }
    }
  }
}
```

Only `payPalTransactionId` is returned to PayPal's `createOrder` callback. After approval, cancellation or a provider error for an existing order, the adapter sends this body to the saved checkout's `complete-order` route:

```json
{
  "completePaymentMethodSpecificInput": {
    "paymentProduct840SpecificInput": {
      "javaScriptSdkFlow": true,
      "action": "CONFIRM_ORDER_STATUS"
    }
  }
}
```

The backend must forward that body using its own PAYONE merchant credentials and return the completion response unchanged. Rejected payments, HTTP 202 or nested completion errors are reported as failure; otherwise the demo reads the existing checkout. Popup approval is not payment proof. It never calls `actions.order.capture()` or `authorize()` in the browser. An authorization-only result remains pending until a later server-side capture; this demo does not include that separate capture operation. See [SDK lifecycle, callbacks and reuse](SDK_CHECKOUT.md).

### Response and status handling

| Backend response | Demo result |
| --- | --- |
| Commerce POST `checkout.errorResponse`, HTTP 202, or rejected/cancelled payment | `failed`; reconcile any created checkout before another attempt |
| `checkout.paymentResponse.merchantAction.redirectData.redirectURL` | `requires-action`; navigate only to absolute HTTP(S) URLs |
| POST payment `CAPTURED` | `succeeded` |
| Authorization only, missing/future status, asynchronous processing | `pending` |
| GET checkout `statusOutput.paymentStatus = PAYMENT_COMPLETED` | `succeeded` |
| Latest payment event rejected/cancelled | `failed` |
| Old `CAPTURED` event without checkout completion | `pending`; not enough evidence on its own |

A successful HTTP status or return query parameter does not prove payment. The server's `payment.captured` webhook, correlated by payment ID, is the authoritative asynchronous capture notification. Handle refunds and chargebacks separately; this demo displays payment completion, not a complete accounting history. With automatic capture, a later `deliver` call records actual fulfillment; do not mark goods delivered just because the customer returned.

## Redirects, persistence and recovery

- The return URL is generated from the current page with only `returned=1` and an opaque `context` UUID. It is capped at 200 characters. Backend URL and initial shipping option are stored under `paypal:return:{origin}{pathname}:{context}` in `sessionStorage`.
- Return context requires the same origin, path and browser tab. Provider-added parameters such as `token` and `PayerID` are not used as payment proof. Missing context is reported instead of silently starting a replacement payment.
- `paypal:order:{backendUrl}` is shared by all three pages. It is saved with `phase: 'submitting'` **before** an order POST and updated to `created` with correlation IDs after a response. This blocks duplicate orders across double clicks, reloads and switching pages in the same tab. SDK checkout additionally stores its PayPal order ID and a `completion: 'submitting' | 'completed'` marker before/after Complete Order. An uncertain completion POST is never repeated automatically, including after reload.
- Express additionally saves `:intent-attempt` before creating an intent and `:intent` for the public SDK context. The latter contains IDs, phase and optional result, never the fetched addresses or account email. A changed-price result can include its authorization redirect URL; treat stored context as transient payment data.
- No POST is automatically retried. A timeout may mean the server processed the request. “Check payment status” uses saved CommerceCase/checkout IDs; without IDs, reconcile using your backend records. Session storage is a demo guard, not server-side idempotency or protection across tabs/devices.
- Only the timing-sensitive intent **GET** retries temporary network failures, HTTP 404/409/503, or responses without address data. It uses 200 ms intervals within a single maximum two-second window. Permanent HTTP errors fail immediately. Reloading an unsuccessful return reads the same saved intent rather than creating another one.
- “Cancel local review” is available before submitting an order. It discards the local intent context and allows another intent. It does **not** call a provider cancellation endpoint or reverse a payment. Once order confirmation starts, status reconciliation replaces cancellation/retry.

For a deliberate new test after reconciling the previous attempt, remove only its exact keys, or use a fresh isolated tab. Example for the default backend:

```js
const key = 'paypal:order:http://localhost:3009/api/';
sessionStorage.removeItem(key);
sessionStorage.removeItem(`${key}:intent`);
sessionStorage.removeItem(`${key}:intent-attempt`);
```

Do not clear these keys to work around a response whose outcome is still unknown.

## Troubleshooting

- **404 at the backend:** include the correct API prefix in `backendUrl`; route names are `commerce-cases`, plural `checkouts`, and `payment-intents`.
- **CORS error:** allow the exact Vite origin at the merchant backend. The SDK page also loads PayPal scripts/popups; allow the required PayPal resources in CSP/network settings. Standard and Express do not load wallet scripts.
- **SDK configuration or popup error:** verify SDK client/merchant IDs and test/live alignment, allow popups, and check the browser console. A configured SDK button does not establish the PAYONE account linkage.
- **Missing `payPalTransactionId`:** preserve the nested payment output in the API wrapper; do not return `payment.id` to the button as a fallback.
- **Complete Order 404 / unsupported route:** add the SDK-specific `complete-order` proxy route with the body above. After an uncertain completion, reconcile the existing payment server-side rather than clicking again.
- **PAYONE rejects product 840:** check the backend merchant's PayPal activation, account mapping, environment and automatic-capture configuration. Preserve the downstream error ID in server logs for reconciliation.
- **Express returns without address:** inspect the unwrapped intent GET response and product-840 output, verify correlation IDs and the intent's `addressSelectionAtPayPal: true`. An incomplete response never authorizes an order submission.
- **Second redirect after review:** expected if the final amount differs from the approved intent. Follow it and reconcile the existing checkout after return.
- **Saved-attempt message:** the demo intentionally prevents a second order. Check the existing checkout or reconcile the uncertain POST first.

## Verification

From the repository root:

```bash
npx vitest run paypal-demo/src/ src/tests/express-checkout.spec.ts
npm run build
npm --prefix paypal-demo run build
npm run lint
npm run format:check
```

Tests mock the network, provider navigation and SDK button. They cover payloads, amount consistency, return context, native intent shapes, correlation, duplicate/uncertain submissions, bounded GET retries, changed-price redirects, SDK order-ID handoff and completion on approval/cancellation/error. Perform the provider-backed acceptance scenarios in the three flow documents with your configured merchant backend.

Current sandbox verification is blocked before buyer approval: Express intent creation returned `50704001 / merchantconfiguration-error-no-such-gateway-configuration`; Standard and SDK order creation returned `50001111 / INVALID_VALUE`, including SDK capture and authorize attempts. A test-merchant/gateway setup issue is the leading hypothesis; the generic `INVALID_VALUE` response does not identify the rejected field. The full provider-backed flow is not yet confirmed. After PAYONE resolves the setup/errors, run the acceptance scenarios in each flow guide.
