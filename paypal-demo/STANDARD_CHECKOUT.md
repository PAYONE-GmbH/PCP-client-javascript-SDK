# PayPal Standard Checkout

Open `/index.html` (or `/`). The shop collects the customer's contact, billing/delivery address and shipping option before handing payment authorization to PayPal. See [setup, configuration and backend contract](README.md).

## Sequence

1. Fill in first name, surname, email, street/house number, optional address information, five-digit German postal code and city. This compact example uses the same address for billing and delivery.
2. Choose Standard or Express shipping. The displayed tax-inclusive total updates from €24.80 to €29.80.
3. “Continue to PayPal” validates the form, snapshots its values, disables editing and creates one CommerceCase with an auto-executed full Order.
4. The backend persists the attempt guard before POST. The payment input specifies product 840, `requiresApproval: false`, `tokenize: false`, `addressSelectionAtPayPal: false` and `javaScriptSdkFlow: false`.
5. If the response contains `checkout.paymentResponse.merchantAction.redirectData.redirectURL`, navigate to it. A synchronous capture or pending response is displayed without inventing a redirect.
6. After PayPal returns, restore the original backend and query the existing checkout. No new order is created. “Check payment status” can repeat this GET.
7. Confirm capture server-side using the webhook. Mark physical delivery only when fulfillment actually occurs.

There is no PaymentIntent in this flow. The shop's address is supplied with the order, rather than being fetched for a review page from PayPal.

## Integrate with public SDK types

Standard redirect checkout uses your merchant backend directly. The package provides payment input/result types; `createStandardCheckout`, `CommerceBackend` and `backendConfig` are local demo helpers, not package exports. Supply your own backend adapter:

```ts
import type { ExpressPaymentResult, PaymentMethodSpecificInput } from 'pcp-client-javascript-sdk';

// Your backend adapter includes the validated merchant contact, shipping and
// cart snapshot, persists the attempt and prevents duplicate order creation.
declare const submitOrder: (input: PaymentMethodSpecificInput) => Promise<ExpressPaymentResult>;
declare const displayResult: (result: ExpressPaymentResult) => void;

const input: PaymentMethodSpecificInput = {
  redirectPaymentMethodSpecificInput: {
    paymentProductId: 840,
    requiresApproval: false,
    tokenize: false,
    redirectionData: { returnUrl: 'https://shop.example/checkout?returned=1' },
    paymentProduct840SpecificInput: {
      addressSelectionAtPayPal: false,
      javaScriptSdkFlow: false,
    },
  },
};
const result = await submitOrder(input);
displayResult(result);
if (result.status === 'requires-action') window.location.assign(result.redirectUrl);
```

In the complete demo, `createStandardCheckout(options, contact, shippingOptionId)` wraps this submission. `returnUrl` and `submit(input, contact, shippingOptionId)` are required; optional `onResult` receives the result once. The local factory clones the merchant contact and memoizes its payment promise, including failures: repeated `pay()` calls do not repeat the POST. `CommerceBackend` additionally guards reloads and page changes. Create a new handle only for a genuinely new, reconciled payment attempt.

For an application with different billing/delivery addresses, pass them independently through `CheckoutContact`. The bundled merchant form deliberately keeps them equal. Pricing belongs in `pricing.ts` and ultimately in your authoritative backend, not in the page entrypoint.

## Manual acceptance scenarios

1. Submit with missing/invalid email or postal code: no network POST occurs.
2. Standard shipping: amount is 2480 EUR cents and cart lines add to 2480. Express shipping: both are 2980.
3. Approve on PayPal: return reaches the original page; a GET reconciles the saved checkout and no second POST occurs.
4. Cancel at PayPal or use browser Back: inspect the existing checkout; returning alone must not display success.
5. Simulate slow asynchronous capture: show pending, then success only after backend confirmation.
6. Double-click payment or reload while POST is outstanding: the saved attempt blocks duplicate orders.
7. Lose the POST response after the server accepted it: reconcile server records; there is no automatic retry.
8. Open a return URL without its same-tab storage: show the missing-context message rather than creating a new payment.
