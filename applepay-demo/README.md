# Apple Pay client SDK demos

Two pages demonstrate the public `PCPApplePaySession` API:

| Page | Flow | Detailed guide |
| --- | --- | --- |
| `/index.html` | Standard Checkout: collect checkout details on the merchant page, then authorize with Apple Pay | [Standard Checkout](STANDARD_CHECKOUT.md) |
| `/express.html` | Express Checkout: collect address and shipping inside Apple Pay | [Express Checkout](EXPRESS_CHECKOUT.md) |

The build has exactly two HTML entry points. Both examples use the same SDK, item, pricing rules, Commerce API mapping and payment-status handling.

## Prerequisites

An Apple Pay-enabled merchant environment, supported browser/device and wallet, merchant validation service, and a payment backend are required. For server, domain, certificates and environment setup, follow:

- Apple: [Setting up your server](https://developer.apple.com/documentation/apple_pay_on_the_web/setting_up_your_server)
- Apple: [Configuring your environment](https://developer.apple.com/documentation/apple_pay_on_the_web/configuring_your_environment)
- PAYONE: [Apple Pay setup](https://docs.commerce.payone.com/docs/payment-methods/apple-pay/apple-setup)

This guide covers the JavaScript client integration and its HTTP contracts. No server provisioning or certificate-conversion instructions are needed here. Client configuration contains public endpoint URLs, never private keys or server credentials. `VITE_` variables are bundled into public JavaScript; they are not secret storage.

## Install and run

From the repository root:

```sh
npm ci
npm run build
npm --prefix applepay-demo ci
npm --prefix applepay-demo run dev
```

Open `/index.html` or `/express.html` on the origin printed by Vite for development. Real wallet interaction requires the Apple/PAYONE environment described above. Build both pages together:

```sh
npm --prefix applepay-demo run build
```

The output is `applepay-demo/dist/`. Both pages are included in the same build; there is no checkout-specific build mode. If your own environment file uses a named Vite mode, pass it normally, e.g. `npm --prefix applepay-demo run build -- --mode express`; that still builds **both** pages.

### Use the build output in your own setup

Copy the **contents** of `applepay-demo/dist/` to your own static hosting or web server, including both HTML files and the complete `assets/` directory. The build output contains browser files only; Node.js and the SDK source tree are not needed to serve it.

With the default build, serve the output at the root of your chosen HTTPS origin:

```text
https://shop.example/index.html    → Standard Checkout
https://shop.example/express.html  → Express Checkout
https://shop.example/assets/…      → Generated JavaScript and CSS
```

To host under a path prefix instead, build with the matching Vite base, for example `npm --prefix applepay-demo run build -- --base=/checkout/`, and publish the contents at `/checkout/`. Preserve both HTML entry points and their asset paths rather than rewriting every request to one HTML page.

Configure the Commerce API base URL and merchant-validation endpoint using the runtime parameters below, or supply the Vite environment values before building. Those services may be part of your own application or separately hosted. They must implement the [client HTTP contracts](#backend-contracts-and-lifecycle); cross-origin services must allow your frontend origin through CORS. The frontend origin and Apple Pay environment must meet the linked Apple/PAYONE prerequisites.

## Runtime parameters

Both pages accept the same URL parameters. URL-encode each value using `URLSearchParams`:

| URL parameter | Vite environment fallback | Meaning |
| --- | --- | --- |
| `backendUrl` | `VITE_BACKEND_BASE_URL` | Absolute Commerce backend base URL, including any `/api/` prefix |
| `validateMerchantUrl` | `VITE_VALIDATE_MERCHANT_URL` | Absolute URL of your existing Apple merchant-validation endpoint |

For example:

```ts
const url = new URL('/express.html', 'https://shop.example'); // or /index.html
url.searchParams.set('backendUrl', 'https://api.example/api/');
url.searchParams.set('validateMerchantUrl', 'https://shop.example/validate-merchant');
window.location.assign(url.href);
```

Alternatively copy the client settings from [`.env.example`](.env.example) into your ignored `.env.local` and restart Vite/rebuild. Explicit URL parameters take precedence. Page navigation preserves these endpoint parameters. Merchant routing is handled by the backend. The Apple Merchant ID is configured by your merchant-validation service.

Routing:

- All Commerce requests are relative to `backendUrl`, e.g. `<backendUrl>/commerce-cases` and `<backendUrl>/commerce-cases/{commerceCaseId}/checkouts/{checkoutId}`.
- No additional authentication flow is added by the demos. Cross-origin endpoints must support the browser's CORS requirements.

### Migration from the previous demo configuration

Standard and Express Checkout use `processPaymentCallback` for payment submission. They do not call a separate `/process-payment` endpoint:

```text
Final Apple payment
  → processPaymentCallback / injected submit callback
  → src/payment.ts: product-302 token and contact mapping
  → src/backend.ts: CommerceBackend.createOrder()
  → POST <backendUrl>/commerce-cases
```

| Previous variable | Current configuration |
| --- | --- |
| `VITE_APPLE_PAY_PROCESS_PAYMENT_URL` | Remove it. Set `VITE_BACKEND_BASE_URL` (or `backendUrl`) to the Commerce API base URL, not to a `/process-payment` endpoint. |
| `VITE_APPLE_PAY_VALIDATE_MERCHANT_URL` | Rename it to `VITE_VALIDATE_MERCHANT_URL`, or pass `validateMerchantUrl` in the page URL. Apple merchant validation is still required. |

The old variable names are no longer read by either page and can be removed from local environment files and deployment/build configuration. The current environment values are optional fallbacks because endpoints can also be supplied through URL parameters or restored redirect context.

The callback returns `ExpressPaymentResult`, distinguishing `succeeded`, `pending`, `requires-action` and `failed`. The SDK still supports the legacy `processPaymentURL` option with its `{ success: boolean }` response contract for existing integrations. That SDK option is independent of Vite variable names; configure either `processPaymentURL` or `processPaymentCallback`, never both. These demos use the callback.

## Module structure and customization

| Module | Responsibility |
| --- | --- |
| `src/main.ts` | Standard page: validate form, snapshot checkout details, initialize wallet, allow editing before submission |
| `src/express.ts` | Express page: initialize wallet directly |
| `src/checkout.ts` | Typed `createStandardCheckout` / `createExpressCheckout` factories; Apple request, totals and shipping callbacks |
| `src/page.ts` | Endpoint configuration, injected submission callback, navigation and result/status UI |
| `src/style.css` | Shared presentation |
| `src/backend.ts` | Existing Commerce HTTP contract, demo cart, redirect context, attempt persistence and status mapping |
| `src/payment.ts` | Apple product-302 token/contact mapping |
| `src/ui.ts` | Status display, redirect handling and payment-status checks |

All demo-specific helpers and tests live inside `applepay-demo/src/`. Standard and Express share these local modules; neither page imports Google Pay or PayPal demo code. The only payment library dependency is the public `pcp-client-javascript-sdk` package. Similar cart/HTTP/UI helpers in the other wallet demos are deliberately independent, so each example can be copied and adapted on its own.

The factories take an `AppleCheckoutOptions` object; they do not access the DOM except through the SDK's injected button selector, read environment variables, or choose a payment backend. The page injects those dependencies:

| Option | Default / behavior |
| --- | --- |
| `validateMerchantURL` | Required validation endpoint |
| `button` | Required `ApplePayButton`: container selector, style/type/locale and optional dimensions |
| `label` | `PAYONE demo`, shown as the Apple Pay total label |
| `applePayVersion` | `4`; choose a version supported by your target Apple environment |
| `supportedNetworks` | `visa`, `masterCard`, `girocard`; use only networks enabled for your PAYONE merchant |
| `submit(payment, shippingMethodId)` | Required async backend integration; returns `ExpressPaymentResult` |
| `onResult(result)` | Receives the backend result after the authorization sheet closes |
| `onCancel()` | Wallet dismissal |
| `onError(phase, error)` | SDK/validation/payment/callback errors |

These factories are example modules, not additional exports of the published SDK. Copy/adapt them in your application or call `PCPApplePaySession.create` directly. The selected demo cart is deliberately fixed: item **€19.90**, shipping **€4.90 / €9.90**, Germany/EUR, inclusive of tax. To change prices/countries, adapt the shared cart/quote rules and backend validation together; changing only the wallet display would produce an inconsistent order. Production prices and address validation belong in your merchant backend.

## Backend contracts and lifecycle

1. The SDK loads Apple's official web SDK and creates the button. Clicking it creates the payment session; compatible third-party browsers may use Apple's device handoff.
2. Merchant validation POSTs `{ "validationURL": "…" }` to `validateMerchantURL`; the endpoint returns the Apple merchant-session JSON directly.
3. `submit` receives the final Apple payment and selected shipping method. The included adapter maps product **302**, `SALE`, encrypted token fields and final contacts into one Commerce order. See [exact Commerce request mapping](../docs/express-checkout-backend.md).
4. `onResult` distinguishes `succeeded`, `pending`, `requires-action` and `failed`. Only captured payment / `PAYMENT_COMPLETED` is shown as paid by these demos. Apple wallet approval or HTTP 200 alone does not establish payment success.
5. Call the returned instance's `destroy()` when removing the component. Both pages do so on `pagehide`. Destroying the UI does not reverse a backend request already submitted.

The SDK supports either `processPaymentCallback` or legacy `processPaymentURL`, never both. These two pages use the callback/Commerce integration. The legacy URL contract `{ success: boolean }` remains part of the SDK, but is not a third demo.

Before a payment POST, the shared adapter stores minimal attempt state in the tab's `sessionStorage`; it does not persist wallet tokens. An existing/uncertain attempt blocks a second submission. Use **Check payment status** after a reload or redirect. Reconcile uncertain outcomes before clearing attempt state.

The payment return URL is limited to 200 characters. The adapter generates a short same-page URL containing a context UUID; endpoint configuration is restored from the same tab's `sessionStorage`. Do not move the return into a new tab or treat the return URL as payment proof. Standard and Express share the Apple attempt lock for the same backend, preventing a page switch from resubmitting an uncertain payment.

## Verification

From the repository root:

```sh
npm test -- --run
npm run build
npm --prefix applepay-demo run build
```

Factory tests verify the distinction between merchant-provided Standard details and wallet-provided Express contacts, shipping recalculation, callback injection and unsupported destinations. SDK regression covers validation, cancellation, payment errors and cloneable requests for cross-browser handoff. Real wallet checks and their actual results are tracked in the [test report](../docs/express-checkout-test-report.md).
