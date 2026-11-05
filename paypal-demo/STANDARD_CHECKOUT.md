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

## Reuse the factory

`src/checkout.ts` exports a headless factory with no DOM selectors or global environment reads:

```ts
import { createStandardCheckout } from './src/checkout';
import { CommerceBackend, backendConfig } from './src/backend';

const config = backendConfig(location.href, import.meta.env);
const backend = new CommerceBackend(config);
const checkout = createStandardCheckout(
  {
    returnUrl: config.returnUrl,
    submit: (input, contact, shipping) =>
      backend.createOrder(input, contact.customer, contact.shippingAddress, shipping),
    onResult: (payment) => {
      // Render the backend result; follow redirectUrl for requires-action.
      document.querySelector('#status')!.textContent = payment.status;
    },
  },
  {
    customer: {
      personalInformation: { name: { firstName: 'Ada', surname: 'Example' } },
      contactDetails: { emailAddress: 'ada@example.test' },
      billingAddress: { countryCode: 'DE', street: 'Example Street 1', zip: '10115', city: 'Berlin' },
    },
    shippingAddress: {
      name: { firstName: 'Ada', surname: 'Example' },
      countryCode: 'DE', street: 'Example Street 1', zip: '10115', city: 'Berlin',
    },
  },
  'standard',
);
await checkout.pay();
```

`returnUrl` is required. `submit(input, contact, shippingOptionId)` is required and returns `Promise<ExpressPaymentResult>`. Optional `onResult` receives the result once. The factory clones the merchant contact and memoizes its payment promise, including failures: repeated `pay()` calls do not repeat the POST. `CommerceBackend` additionally guards reloads and page changes. Create a new handle only for a genuinely new, reconciled payment attempt.

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
