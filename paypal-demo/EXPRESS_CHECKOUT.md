# PayPal Express Checkout

Open `/express.html`. The customer chooses their delivery address on PayPal before the shop creates the final order. The shop then displays an editable review of that address and shipping costs. See [setup, configuration and backend contract](README.md).

## Sequence

1. “Continue to PayPal” creates a PaymentIntent for the configured initial shipping option. Its `redirectPaymentMethodSpecificInput` contains product 840, `requiresApproval: false`, `addressSelectionAtPayPal: true` and `javaScriptSdkFlow: false`.
2. Extract the POST response's `paymentIntentOutput.paymentIntentId`, `paymentIntentOutput.paymentId` and `paymentIntentOutput.redirectPaymentMethodSpecificOutput.redirectData.redirectURL`. Persist the IDs and `redirected` phase before navigation.
3. After return, GET `/payment-intents/{paymentIntentId}`. Unlike POST, this response is unwrapped. Temporary/incomplete reads retry only within two seconds.
4. Validate the returned intent ID, payment ID, payment product and existence of a shipping address. Neither query parameters nor the mere redirect return constitute approval or payment success.
5. Read `redirectPaymentMethodSpecificOutput.paymentProduct840SpecificOutput`: `shippingAddress` fills the delivery form, `customerAccount` supplies name/email, and `billingAddress` supplies billing data (often country only). Only German delivery addresses can proceed.
6. Let the customer correct delivery details, choose shipping and explicitly press “Place order and pay”. No order is posted during the intent GET or review rendering. Optional address information is preserved in the editable form.
7. Create the CommerceCase with an auto-executed full Order. Use the reviewed delivery address and final total; retain the PayPal customer's billing/account data. Set `addressSelectionAtPayPal: false`, keep `javaScriptSdkFlow: false` and `requiresApproval: false`, and pass the **original intent `paymentId`** in `paymentProduct840SpecificInput.paymentId`.
8. If the final total differs, the response may include a new `checkout.paymentResponse.merchantAction.redirectData.redirectURL`. Persist the submitted result before navigating to PayPal for re-approval. Returning from this redirect checks the existing checkout instead of resubmitting the order.
9. Capture/pending/failure is determined from the backend response and checkout GET, with the server's capture webhook as asynchronous authority.

### Initial intent payload

```json
{
  "amountOfMoney": { "amount": 2480, "currencyCode": "EUR" },
  "references": { "merchantReference": "unique-intent-ref" },
  "shoppingCart": { "items": [
    { "orderLineDetails": { "productCode": "PAYPAL-DEMO", "productName": "Demo item", "productType": "GOODS", "productPrice": 1990, "quantity": 1 } },
    { "orderLineDetails": { "productCode": "standard", "productName": "Shipping", "productType": "SHIPMENT", "productPrice": 490, "quantity": 1 } }
  ] },
  "paymentMethodSpecificInput": {
    "redirectPaymentMethodSpecificInput": {
      "paymentProductId": 840,
      "requiresApproval": false,
      "redirectionData": { "returnUrl": "https://shop.example/express.html?returned=1&context=opaque-id" },
      "paymentProduct840SpecificInput": { "addressSelectionAtPayPal": true, "javaScriptSdkFlow": false }
    }
  }
}
```

The final order uses the [shared CommerceCase shape](README.md#standard-order-example), with final customer/address/cart data and `paymentProduct840SpecificInput.paymentId` set. `paymentIntentId` identifies the GET resource; `paymentId` links the actual payment. They are not interchangeable.

## Factory and public SDK

`createExpressCheckout(options)` in `src/checkout.ts` specializes the public `PCPPayPalExpress<PaymentIntentResponse>` state machine with correlation checks and product-840 mapping.

| Option | Purpose |
| --- | --- |
| `returnUrl` | Generated same-page payment return URL |
| `createIntent()` | POST once; resolve `{ paymentIntentId, paymentId, redirectUrl }` |
| `loadIntent(paymentIntentId)` | GET the unwrapped intent output |
| `review()` | Return `{ shippingAddress, shippingOptionId }` from the customer's explicitly reviewed form |
| `submit(input, contact, shippingOptionId)` | Submit the linked final order; resolve an `ExpressPaymentResult` |
| `persist(context)` | Synchronously save IDs/phase/result; `null` clears local context |
| `onResult`, `onCancel`, `onError` | Optional callbacks for application UI |
| `navigate(url)` | Optional navigation override; defaults to `location.assign` after HTTP(S) validation |

Example wiring (the review form is filled after `resume`):

```ts
import { createExpressCheckout } from './src/checkout';
import { CommerceBackend, backendConfig } from './src/backend';
import { formContact } from './src/payment';

const backend = new CommerceBackend(backendConfig(location.href, import.meta.env));
const key = `${backend.storageKey}:intent`;
const form = document.querySelector<HTMLFormElement>('#contact')!;
const shipping = document.querySelector<HTMLSelectElement>('#shipping')!;
const checkout = createExpressCheckout({
  returnUrl: backend.config.returnUrl,
  createIntent: () => backend.createIntent(),
  loadIntent: (id) => backend.loadIntent(id),
  persist: (context) => {
    if (context) sessionStorage.setItem(key, JSON.stringify(context));
    else sessionStorage.removeItem(key);
  },
  review: () => ({ shippingAddress: formContact(form).shippingAddress, shippingOptionId: shipping.value }),
  submit: (input, contact, optionId) => backend.createOrder(input, contact.customer, contact.shippingAddress, optionId),
});
// Bind checkout.start() to the initial button. After redirect, restore saved
// context and await checkout.resume(context), then prefill and validate the form.
// Bind checkout.confirm() only to the explicit review submission.
```

The complete page wiring is in `src/express.ts`. The public SDK has no backend routes, DOM or storage assumptions; callbacks inject those responsibilities. `start()` saves `redirected`; `resume()` loads data and saves `review`; `confirm()` saves `confirming` before POST and `submitted` after its response. Concurrent confirmations share one promise. A restored `confirming` context cannot resubmit. A failed resume clears previously loaded in-memory data, preventing confirmation with stale intent data.

`cancel()` clears only local pre-order review state. It is rejected once confirmation begins. Returning from PayPal cancellation with incomplete address data leaves the form disabled; an existing review can be resumed by reloading the same page. Provider-side payment cancellation/refunds require backend handling.

## Manual acceptance scenarios

1. Initial click creates exactly one intent and no CommerceCase. Check `addressSelectionAtPayPal: true` and the configured initial amount.
2. Return and GET intent: verify IDs, customer email, billing country and delivery form values; no order POST occurs yet.
3. Approve unchanged Standard shipping: final amount remains 2480 cents and the same payment ID links intent/order.
4. Change to Express shipping: final amount is 2980 cents; follow a returned re-approval URL, then check the existing checkout without another POST.
5. Correct delivery details, including additional information, and verify the final shipping payload matches the review. PayPal billing/account data remains distinct.
6. Return a non-German address: confirmation stays disabled. Missing address, product mismatch or ID mismatch must never submit an order.
7. Simulate temporary intent 404/409/503 and incomplete 200 responses: retry GET within two seconds, then display an error. No intent POST retry occurs.
8. Double-click confirmation, reload during submission, or lose the final POST response: do not create another order.
9. Cancel local review: no CommerceCase/order is created; starting again creates a new intent. Confirming/submitted payments cannot be locally cancelled.
10. Cancel on the provider page or lose same-tab storage: do not infer payment success or silently start a replacement attempt.
