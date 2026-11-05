# PayPal SDK Checkout

Open `/sdk.html`. The shop collects billing/delivery details, then renders an official PayPal JavaScript SDK button. Approval normally happens in a popup. See [setup, public configuration and complete backend contract](README.md).

## Sequence

1. Configure the merchant backend plus public SDK client/merchant IDs. The SDK account ID is distinct from the PAYONE API merchant ID; sandbox buyer credentials are entered only in the PayPal popup.
2. Fill out the merchant address and shipping option. The demo uses one address for billing and delivery, with totals of €24.80 / €29.80 inclusive of tax.
3. “Prepare PayPal button” validates and snapshots the form. It loads the SDK for EUR, the configured locale and intent, `commit: true`, `vault: false`, and renders a single PayPal funding button. It does not create a payment yet.
4. Before payment starts, “Edit address / shipping” destroys the button and unlocks the form. Once an order attempt exists, editing is blocked for that attempt.
5. Clicking PayPal triggers SDK `createOrder`. The adapter saves the attempt marker before POSTing one CommerceCase with an auto-executed FULL Order, product 840, `addressSelectionAtPayPal: false`, `javaScriptSdkFlow: true` and `tokenize: false`. `capture` maps to `requiresApproval: false`; `authorize` to `true`.
6. The response's `checkout.paymentResponse.payment.paymentOutput.redirectPaymentMethodSpecificOutput.payPalTransactionId` is returned as the SDK order ID. The PAYONE payment ID is retained separately. Missing output is an error; there is no fallback to another ID.
7. The popup authenticates the buyer. `onApprove` validates `data.orderID` against the saved PayPal order ID. A cancellation or provider error also synchronizes the known order. Errors before any order exists have nothing to complete.
8. Synchronization POSTs `CONFIRM_ORDER_STATUS` to the existing checkout's `complete-order` endpoint, then GETs its status. The browser never calls PayPal's `actions.order.capture()` or `authorize()`.
9. Backend status determines success, pending or failure. A popup approval is not a capture confirmation. Use server-side webhooks for fulfillment decisions; delivery is recorded only after actual fulfillment.

There is no PaymentIntent, PayPal-address retrieval or Express review step on this page. Contact and price are the shop's immutable snapshot. The SDK return URL is still present in the order input; a fallback return reconciles the saved checkout instead of creating another payment.

## Configuration

| Setting | URL / environment | Meaning |
| --- | --- | --- |
| Backend | `backendUrl` / `VITE_BACKEND_BASE_URL` | Required API base, including its prefix. |
| Initial shipping | `shipping` / `VITE_SHIPPING_OPTION` | `standard` or `express`. |
| SDK client | `clientId` / `VITE_PAYPAL_CLIENT_ID` | Required public SDK client ID. |
| SDK merchant | `merchantId` / `VITE_PAYPAL_MERCHANT_ID` | Required public PayPal account ID, not PAYONE API merchant routing. |
| Intent | `intent` / `VITE_PAYPAL_INTENT` | `capture` by default; `authorize` requires later capture in your backend. |
| Locale | `locale` / `VITE_PAYPAL_LOCALE` | `de_DE` by default. |

URL values override environment values. Currency and country are deliberately fixed to EUR/DE in the demo catalogue and backend payload. Change both together when adapting the example. `.env.example` contains the fixed sandbox SDK IDs; copying those does not configure the API wrapper's merchant or enable PayPal for it. Existing `.env.local` files need the SDK variables added explicitly.

## Reuse the factory

`src/sdk-checkout.ts` exports `createSdkCheckout(options, contact, shippingOptionId)`. SDK-only options extend the public `PayPalSdkConfig`; all backend operations are injected:

```ts
import { CommerceBackend, backendConfig } from './src/backend';
import { paypalConfig } from './src/config';
import { formContact } from './src/payment';
import { createSdkCheckout } from './src/sdk-checkout';

const config = backendConfig(location.href, import.meta.env);
const backend = new CommerceBackend(config);
const form = document.querySelector<HTMLFormElement>('#contact')!;
if (!form.reportValidity()) throw new Error('Complete the merchant form first.');
const shipping = new FormData(form).get('shipping')!.toString();
const checkout = await createSdkCheckout({
  ...paypalConfig(location.href, import.meta.env),
  selector: '#paypal-button',
  returnUrl: config.returnUrl,
  createOrder: (input, contact, option) =>
    backend.createSdkOrder(input, contact.customer, contact.shippingAddress, option),
  completeOrder: (order) => backend.completeSdkOrder(order),
  onResult: (payment) => { document.querySelector('#status')!.textContent = payment.status; },
  onCancel: () => { document.querySelector('#status')!.textContent = 'Cancelled; reconcile checkout status.'; },
  onError: (error) => { document.querySelector('#status')!.textContent = error.message; },
}, formContact(form), shipping);

// Before replacing/unmounting the page:
await checkout.destroy();
```

Required options: `clientId`, `merchantId`, `intent`, `locale`, `selector`, `returnUrl`, `createOrder(input, contact, shipping)` and `completeOrder(order)`. `createOrder` returns `{ commerceCaseId, checkoutId, orderId, paymentId? }`, where `orderId` is the PayPal transaction/order ID. Completion returns `Promise<ExpressPaymentResult>`.

Optional options: `onResult`, `onCancel`, `onError`, `buttonStyle` (official SDK button style) and `loadPayPal` (SDK-loader injection, useful for tests). Default button style is vertical/gold/rect/PayPal. `onCancel` receives the reconciled result when a known order existed; no result is available if cancelled before order creation. `onError` can report an initial SDK error and a subsequent synchronization failure. Status synchronization after an SDK error can additionally emit `onResult`; use the backend result to determine the payment state.

The factory clones contact data, memoizes creation and completion (including failed promises), and checks callback correlation. It closes only its owned button and suppresses late UI callbacks on destroy. The page destroys a handle that finishes initialization after navigation. The SDK script may remain loaded. For a different SDK client, merchant or intent, reload the page to avoid mixing SDK configurations.

## Recovery and persistence

The shared order marker stores correlation IDs, the SDK order ID and a completion phase, never the entered address/email. Completion is marked `submitting` before its POST and `completed` after a response. No POST is automatically retried. Reload/page changes block new orders and provide GET status reconciliation.

If the browser is closed or connectivity is lost before completion, GET status alone may remain pending. Reconcile the saved IDs with your backend and complete status propagation there when appropriate. The demo deliberately does not replay an uncertain Complete Order request after reload. A new test attempt must only be started after the previous outcome is reconciled; see the exact storage-key cleanup in the shared guide.

## Manual acceptance scenarios

1. Open Standard and Express without SDK IDs: both still work independently. On `/sdk.html`, missing IDs show a configuration error before enabling the form.
2. Prepare with missing/invalid fields: no SDK order POST occurs. Preparing valid details loads the button but still makes no order POST.
3. Edit before clicking PayPal: old button closes; the next button uses the updated address and consistent shipping/cart amount.
4. Approve: exactly one CommerceCase POST, one Complete Order POST and a checkout GET. PayPal receives `payPalTransactionId`, not `payment.id`.
5. Cancel after order creation or simulate a popup error: synchronize the known order without a replacement order. Cancellation alone does not claim payment success.
6. Simulate a pre-order SDK load/render error: no Complete Order request is made.
7. In `authorize` mode, verify SDK intent and `requiresApproval: true`; do not report capture from approval or authorization alone. Perform later capture only in the backend.
8. Double callbacks, lost create/completion responses and reloads: no duplicate financial POST; use saved IDs and backend reconciliation.
9. HTTP success with nested payment errors remains failure. Webhook confirmation and checkout completion determine success, not the popup or return URL.
