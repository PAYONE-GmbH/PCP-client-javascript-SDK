# Google Pay — Standard and Express Checkout

Two small, framework-free Google Pay demos, following the same structure as the [Apple Pay demos](../applepay-demo/README.md):

| Page | Contact / shipping owner | Wallet integration | Flow guide |
| --- | --- | --- | --- |
| `/index.html` | Merchant form, confirmed before payment | Official `@google-pay/button-element` | [Standard Checkout](STANDARD_CHECKOUT.md) |
| `/express.html` | Google Pay sheet, including shipping choices | Public `PCPGooglePayExpress` SDK adapter | [Express Checkout](EXPRESS_CHECKOUT.md) |

Both use the same configuration, quote, payment mapping, backend adapter and status UI. Neither submits an order while the customer is merely changing address/shipping. Google Pay authorizes wallet data; PAYONE and your backend determine whether the payment was captured.

## Run locally

Use the Node version in the root `.nvmrc`. From the repository root:

```bash
npm ci
npm run build
npm --prefix googlepay-demo ci
cp googlepay-demo/.env.example googlepay-demo/.env.local
# Edit .env.local: backend URL, PAYONE gateway merchant ID and public Google settings.
npm --prefix googlepay-demo run dev
```

Open the Vite URL printed in the terminal and choose `index.html` or `express.html`. The demo has no bundled payment server: point it at your merchant backend with the contract below. `npm --prefix googlepay-demo run build` builds both entry pages; `npm --prefix googlepay-demo run preview` previews that build.

Google Pay needs a supported browser, a suitable Google account/card and a secure context. Use localhost where supported for development and HTTPS for deployed checkout/testing; opening the HTML as `file://` does not work. To test from another device use a reachable HTTPS frontend/backend rather than that device's localhost. The Vite configuration does not install a TLS certificate or start a tunnel.

## Configuration

These are **public browser settings**. Query parameters override environment variables; restart Vite after editing `.env.local`. `VITE_` values are built into the browser bundle.

| Query parameter | Environment variable | Default / requirement |
| --- | --- | --- |
| `backendUrl` | `VITE_BACKEND_BASE_URL` | Required. Absolute HTTP(S) base URL ending **before** `commerce-cases`; a trailing slash is normalized. Credentials, query and fragment are rejected. |
| `environment` | `VITE_GOOGLE_ENVIRONMENT` | `TEST`; only `TEST` and `PRODUCTION` are accepted. |
| `gatewayMerchantId` | `VITE_GOOGLE_GATEWAY_MERCHANT_ID` | Required PAYONE ID, commonly `P1_XXXXX_YYYYYYY`. |
| `merchantId` | `VITE_GOOGLE_MERCHANT_ID` | Separate **Google** merchant ID; required in `PRODUCTION`, optional and omitted when absent in `TEST`. |
| `merchantName` | `VITE_GOOGLE_MERCHANT_NAME` | `PAYONE demo`. Use your registered merchant name in production. |
| `buttonLocale` | `VITE_GOOGLE_BUTTON_LOCALE` | `de`; use a Google-supported button locale, e.g. `en`. |
| `allowedAuthMethods` | `VITE_GOOGLE_ALLOWED_AUTH_METHODS` | Comma-separated `CRYPTOGRAM_3DS` (default) and/or `PAN_ONLY`; see desktop testing below. |

Example runtime URL (replace the example backend and ID):

```text
http://localhost:5173/express.html?backendUrl=https%3A%2F%2Fbackend.example%2Fpcp%2Fv1%2Fmerchant-id%2F&environment=TEST&gatewayMerchantId=P1_XXXXX_YYYYYYY&merchantName=My%20shop&buttonLocale=en
```

The navigation link carries explicit runtime settings to the other page. `returned` and `context` are reserved for 3DS returns, not merchant settings.

### Deliberately fixed demo policy

- Google Pay API `2.0`, gateway `payonegmbh`, product **320**.
- Visa and Mastercard; default `allowedAuthMethods: ['CRYPTOGRAM_3DS']`. Auth methods are configurable for explicit testing; actual use of `PAN_ONLY` must match your PAYONE integration.
- Germany only, EUR, one item at **€19.90**; Standard shipping **€4.90**, Express **€9.90**. Totals are **€24.80 / €29.80**, inclusive of tax. There is no extra tax line.
- Prices are integer cents in `pricing.ts` / Commerce requests; Google's decimal strings are generated only at the wallet boundary. Item and shipping cart lines sum to the same total.
- The shared `GoogleCheckoutOptions` also accepts `selector`, `buttonColor`, `buttonType`, and injected `submit`, `onResult`, `onCancel`, `onError` callbacks. See the two flow guides for copyable factory examples.

For another catalog/currency/country, adapt `pricing.ts`, the request's currency/country, contact restrictions and backend pricing **together**. In a real shop, retrieve and validate authoritative prices on the server; the example's browser quote is not an order-pricing authority.

## Module map

| File | Responsibility |
| --- | --- |
| `src/main.ts` | Standard merchant form, immutable checkout snapshot, edit/destroy handling |
| `src/express.ts` | Thin Express page entry and lifecycle cleanup |
| `src/checkout.ts` | Shared Google request and typed options; separate Standard/Express factories |
| `src/config.ts` | Public Google configuration and test/live validation |
| `src/pricing.ts` | Local DE/EUR quote, decimal formatting and matching Commerce cart |
| `src/payment.ts` | Final contact mapping and original token → product-320 input |
| `src/backend.ts` | Backend configuration, one-shot order submission, references and status mapping |
| `src/page.ts` | Connect the selected flow to configuration, backend and return handling |
| `src/ui.ts` | Accessible text status, status checks and 3DS navigation |
| `src/style.css` | Shared minimal page styling |

All helpers are demo-local and can be copied independently of Apple Pay/PayPal. The Standard button library is imported on demand when the customer confirms the merchant form; Express uses the public SDK and loads Google's `pay.js` when needed.

## Merchant backend contract

### Routes and responsibility

The browser calls these paths relative to `backendUrl`:

```text
POST commerce-cases
GET  commerce-cases/{commerceCaseId}/checkouts/{checkoutId}
```

For example, `backendUrl=https://backend.example/pcp/v1/merchant-id/` produces `POST https://backend.example/pcp/v1/merchant-id/commerce-cases`. The server maps that to PAYONE `POST /v1/{merchantId}/commerce-cases` and the corresponding GET checkout operation, authenticates to PAYONE, and returns the Commerce-compatible response body and HTTP status. A server-managed merchant route such as `https://backend.example/api/` works equally well; the adapter does not append a merchant ID on its own.

There is no merchant-validation endpoint as there is for Apple Pay, and no invented `authorize`/`capture`/`quote` endpoint. PAYONE credentials remain on your server. The example fetch adapter uses `credentials: 'omit'`, no Authorization header, JSON POSTs and a 20-second timeout. Adapt that boundary to your application's session/authentication model. Cross-origin deployments must allow the frontend origin, GET/POST and the JSON Content-Type header (including the preflight).

The backend must bind the request to the merchant's checkout, validate final contacts/cart/amount, enforce idempotency/reconciliation, and apply the real merchant configuration. Browser guards are just demo UX. Do not log the token or full payment/contact data. Base64 is transport encoding, not additional encryption.

### Product 320 and token encoding

The source string is **exactly**:

```typescript
payment.paymentMethodData.tokenizationData.token
```

`googleInput()` UTF-8 encodes that original string and Base64 encodes the bytes once. It does **not** JSON-parse/re-serialize the token, encode the whole `PaymentData`, double-encode it, or decrypt it. The resulting request field is:

```json
{
  "mobilePaymentMethodSpecificInput": {
    "paymentProductId": 320,
    "authorizationMode": "SALE",
    "encryptedPaymentData": "<Base64 of the original UTF-8 Google token>",
    "threeDSecure": {
      "redirectionData": {
        "returnUrl": "https://shop.example/index.html?returned=1&context=<opaque-id>"
      }
    }
  }
}
```

The merchant backend forwards this already-encoded field without encoding it again. `SALE` captures immediately when supported; `PRE_AUTHORIZATION` is a different lifecycle requiring explicit backend capture handling and is not enabled by this demo.

### Commerce request

Abbreviated POST payload for Standard shipping; the Express page produces the same shape from the final Google contacts:

```json
{
  "customer": {
    "personalInformation": { "name": { "firstName": "Example", "surname": "Buyer" } },
    "contactDetails": { "emailAddress": "buyer@example.test", "phoneNumber": "+49123456789" },
    "billingAddress": { "countryCode": "DE", "city": "Berlin", "zip": "10115", "street": "Example 1" }
  },
  "checkout": {
    "amountOfMoney": { "amount": 2480, "currencyCode": "EUR" },
    "references": { "merchantReference": "<20-character-reference>" },
    "shipping": {
      "address": {
        "countryCode": "DE", "city": "Berlin", "zip": "10115", "street": "Example 1",
        "name": { "firstName": "Example", "surname": "Buyer" }
      }
    },
    "shoppingCart": {
      "items": [
        { "orderLineDetails": { "productCode": "GOOGLE-DEMO", "productName": "Demo item (tax included)", "productType": "GOODS", "productPrice": 1990, "quantity": 1 } },
        { "orderLineDetails": { "productCode": "standard", "productName": "Shipping", "productType": "SHIPMENT", "productPrice": 490, "quantity": 1 } }
      ]
    },
    "autoExecuteOrder": true,
    "orderRequest": {
      "orderType": "FULL",
      "orderReferences": { "merchantReference": "<same-20-character-reference>" },
      "paymentMethodSpecificInput": {
        "mobilePaymentMethodSpecificInput": {
          "paymentProductId": 320, "authorizationMode": "SALE",
          "encryptedPaymentData": "<single-encoded-token>",
          "threeDSecure": { "redirectionData": { "returnUrl": "<short-return-url>" } }
        }
      }
    }
  }
}
```

Standard currently uses one form address for billing and shipping. Express maps Google's final billing and shipping independently. Google's single full-name string is split into first names and last word as surname in `googleContact()`; adapt this demo heuristic to your customer/address model for real international names. Additional address lines are retained. The optional PAYONE `state` is sent only if the trimmed Google administrative area matches `[a-zA-Z0-9]{1,3}`. Empty values and full region names such as `Berlin` are omitted from both billing and shipping; they are not truncated or converted to invented codes. This demo supports German addresses, where this field is optional.

### Responses, 3DS and completion

`mapCreated()` reads `commerceCaseId`, `checkout.checkoutId`, `checkout.paymentResponse.payment.id/status` and `checkout.paymentResponse.merchantAction.redirectData.redirectURL`.

| Response | Demo result |
| --- | --- |
| HTTP 202, `checkout.errorResponse`, or rejected/cancelled payment status | `failed`; reconcile the created checkout before retrying |
| `redirectURL` | `requires-action`; close the wallet, navigate to the issuer |
| Payment `status: 'CAPTURED'` | `succeeded` |
| HTTP success without capture, including authorization-only / `PENDING_CAPTURE` | `pending` |

For example, a 3DS response can look like:

```json
{
  "commerceCaseId": "case-id",
  "checkout": {
    "checkoutId": "checkout-id",
    "paymentResponse": {
      "merchantAction": { "redirectData": { "redirectURL": "https://issuer.example/challenge" } }
    }
  }
}
```

Native Google `SUCCESS` means the wallet can close. It can represent `pending` or `requires-action`, not only a captured payment. The factories expose the actual backend result after sheet completion. A decline or submission error instead produces native `ERROR`.

The return URL is limited to **200 characters**. `backendConfig()` stores the backend base in same-tab `sessionStorage` under an opaque context ID and strips the runtime configuration from the return URL. A 3DS return restores that context, retrieves the saved attempt and performs the GET checkout call without creating another Google session. A lost context produces an explicit error; the redirect itself never marks an order paid.

The GET body has a different shape from POST: `statusOutput.paymentStatus === 'PAYMENT_COMPLETED'` maps to success. Recent rejected/cancelled events map to failure; other states remain pending. An old `CAPTURED` event alone is not enough to declare the current checkout completed. Use the **Check payment status** action to reconcile a pending attempt.

Production order completion is driven by your backend and PAYONE webhooks, including `payment.captured`; never fulfill based solely on Google callbacks, return parameters or frontend text. A physical delivery request is a separate server-side operation after fulfillment, not something performed on wallet approval.

### Duplicate and uncertain submissions

Both factories cache an authorization attempt; the backend adapter also records a `submitting` marker **before** the POST. The shared Standard/Express marker is scoped to this backend URL in the tab, so switching pages or reloading does not silently submit another order. On a valid response, only checkout/payment IDs are saved; tokens and addresses are not persisted by the demo.

After a timeout or lost response the marker intentionally remains. There is no automatic POST retry, token reuse or reset button. Reconcile in the backend, particularly when no IDs reached the browser. For a **new test order after reconciliation**, clear that backend's `google:order:<normalized-backend-url>` session-storage entry in browser DevTools or start a fresh test session. Closing/clearing browser state is not cancellation or refund of a server-side payment. A production integration should use server-managed attempt IDs/idempotency instead of manual test resets.

## Verification

From the repository root:

```bash
npx vitest run googlepay-demo/src/ src/tests/express-checkout.spec.ts
npm run build
npm --prefix googlepay-demo run build
npm run lint
npm run format:check
```

The Google demo tests cover configuration, original UTF-8 token encoding, contact mapping, Standard snapshot/final totals, Express redacted-address/shipping updates, mismatched final choices, duplicate authorization, declines, late callbacks, Commerce payload sums, uncertain POSTs and 3DS/status mapping. The SDK suite also covers the Express adapter's native Google callbacks, cancellation and destroy behavior. Google services and HTTP are mocked; these checks do not exercise a live wallet or PAYONE transaction. Manual browser scenarios are in each flow guide.

## Troubleshooting script loading and availability

### Desktop Chrome on macOS: test card-on-file support

If `window.isSecureContext` is `true`, the Google API is loaded, and readiness still returns `false`, the requested authentication methods may be unsupported by the current browser/device setup. The default `CRYPTOGRAM_3DS` refers to Android device tokens, not simply any card saved in a Google Account. A Mac browser with the API loaded is therefore not sufficient evidence of support for that request.

For an explicit **TEST** of Google Account cards, open:

```text
http://localhost:5173/?environment=TEST&allowedAuthMethods=PAN_ONLY,CRYPTOGRAM_3DS
```

For Express, use `/express.html` with the same query. Alternatively, set `VITE_GOOGLE_ALLOWED_AUTH_METHODS=PAN_ONLY,CRYPTOGRAM_3DS` in `.env.local` and restart Vite. Both factories use the same configured methods for readiness and payment requests. No token or payment data is logged. A positive readiness result only establishes wallet availability; backend payment processing is a separate step.

This explicitly broadens the request to include account cards; it does not prove PAYONE approval for `PAN_ONLY` payments. Keep the default until the methods supported for your merchant are established. Google also requires both methods for its qualifying cross-device verification flow. See [Google's CardParameters reference](https://developers.google.com/pay/api/web/reference/request-objects#CardParameters).

If this TEST still returns `false`, inspect browser console/network errors and retry in a regular Chrome profile with interfering extensions disabled. Changing the backend URL cannot fix readiness: the backend is first called during payment authorization.

### Commerce HTTP 200 with payment configuration error 1201

A created Commerce Case does not establish a successful payment. If `checkout.errorResponse.errors` contains `1201 / PAYMENT_PRODUCT_CONFIGURATION_ERROR`, the downstream payment platform rejected the payment product configuration. The demo surfaces this specific error instead of reporting success from the HTTP status. Ask PAYONE to check Google Pay product **320** for the backend's merchant and test/live environment, its associated gateway merchant ID, supported networks/authentication methods and SALE support. A working Google wallet does not establish those backend settings. In particular, enabling `PAN_ONLY` for a desktop test does not establish merchant support for that method.

Provide PAYONE with the response's `errorId`, `commerceCaseId`, `checkoutId`, `paymentExecutionId` and timestamp to locate the rejected attempt. The error code alone does not identify which configuration setting is wrong. Resolve the configuration and reconcile the existing checkout before a new payment attempt; polling cannot repair a rejected execution.

### Script failures and retained Google errors

Google's `https://pay.google.com/gp/p/js/pay.js` is loaded as a **classic script without a `crossorigin` attribute**. Its response need not include `Access-Control-Allow-Origin`; forcing `crossorigin="anonymous"` turns this into a CORS request and can block it. Do not replace the script URL with a backend proxy or disable browser CORS checks.

After updating SDK loader code, run `npm run build` from the repository root, restart Vite with `npm --prefix googlepay-demo run dev -- --force`, and fully reload the page. The demo's `file:..` dependency reads the built SDK in `dist`, not the TypeScript source. If a failed script was inserted by the host page, remove its `crossorigin` attribute in the integration and reload too.

If Standard reports a Google error, the page retains its specific `statusCode` / `statusMessage` rather than replacing it with “Google Pay is not available.” A genuine negative readiness result still displays the latter. Check the browser console/network details, secure context and supported browser/account/card setup; a successful `pay.js` download alone does not guarantee wallet readiness. A remaining script failure can also come from a browser extension, CSP or network filter. The Express script-loader fix does not by itself establish the cause of a Standard readiness failure.

## Production setup and Google references
- [Google Web API](https://developers.google.com/pay/api/web/overview), [request objects](https://developers.google.com/pay/api/web/reference/request-objects) and [test card suite](https://developers.google.com/pay/api/web/guides/resources/test-card-suite)

Enable Google Pay for your PAYONE merchant, configure the gateway and complete Google Pay & Wallet Console onboarding/production approval for the actual website. Use matching PAYONE test/live configuration and Google environment. `PRODUCTION` requires your Google merchant ID and approved merchant/domain setup; `TEST` is not proof of live approval. If embedded, every relevant iframe must permit payment (`allow="payment"`).
