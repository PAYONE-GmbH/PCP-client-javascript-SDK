# Apple Pay Express Checkout

The single Express demo is [`express.html`](express.html), initialized by [`src/express.ts`](src/express.ts). It opens Apple Pay directly; the wallet collects the customer's address and shipping choice.

For installation, endpoint parameters, backend contract, shared options and Apple/PAYONE setup references, see the [demo README](README.md).

## Flow

1. Click Apple Pay. The initial total is **€24.80**: item €19.90 plus Standard shipping €4.90, tax included.
2. Select a German shipping contact in the wallet. The shipping-contact callback can receive partial/redacted data; it only updates the displayed quote and does not create an order.
3. Choose Standard or Express shipping. The shipping-method callback returns the matching total and line items: **€24.80 / €29.80**.
4. Authorize. Only now does the payment callback receive the final token and full contacts and submit one Commerce order.
5. Follow the backend result, redirect if required, and reconcile status after return/reload.

## Integrate the public SDK

Import the published SDK directly. The callbacks below are supplied by your application; the complete shipping/pricing implementation is shown in [`src/checkout.ts`](src/checkout.ts). `createExpressCheckout` and `AppleCheckoutOptions` are local demo helpers, not package exports.

```ts
import { PCPApplePaySession, type PCPApplePaySessionConfig } from 'pcp-client-javascript-sdk';

declare const submitOrder: PCPApplePaySessionConfig['processPaymentCallback'];
declare const displayResult: PCPApplePaySessionConfig['resultCallback'];
declare const displayError: PCPApplePaySessionConfig['errorCallback'];
declare const updateShippingContact: PCPApplePaySessionConfig['shippingContactAddressSelectedCallback'];
declare const updateShippingMethod: PCPApplePaySessionConfig['shippingMethodSelectedCallback'];

const instance = await PCPApplePaySession.create({
  validateMerchantURL: 'https://shop.example/validate-merchant',
  countryCode: 'DE',
  currencyCode: 'EUR',
  merchantCapabilities: ['supports3DS'],
  total: { label: 'My shop', amount: '24.80', type: 'final' },
  applePayVersion: 4,
  supportedNetworks: ['visa', 'masterCard', 'girocard'],
  requiredShippingContactFields: ['postalAddress', 'name', 'email', 'phone'],
  requiredBillingContactFields: ['postalAddress', 'name'],
  shippingMethods: [
    { identifier: 'standard', label: 'Standard', detail: 'Delivery in Germany', amount: '4.90' },
    { identifier: 'express', label: 'Express', detail: 'Delivery in Germany', amount: '9.90' },
  ],
  shippingContactAddressSelectedCallback: updateShippingContact,
  shippingMethodSelectedCallback: updateShippingMethod,
  processPaymentCallback: submitOrder,
  resultCallback: displayResult,
  cancelCallback: () => { /* Restore your checkout UI. */ },
  errorCallback: displayError,
}, {
  selector: '#wallet',
  config: {
    buttonstyle: 'black',
    type: 'check-out',
    locale: 'de-DE',
    style: { width: '240px', height: '44px' },
  },
});

// When your application removes this checkout:
// instance.destroy();
```

The shipping callbacks must return matching totals, line items and available methods, and retain the selected method for final submission. In the demo, the local factory shares that logic with Standard Checkout; `src/page.ts` supplies the Commerce adapter and status UI. These application helpers are not part of the SDK.

## Callback behavior

| SDK callback | Demo behavior |
| --- | --- |
| `shippingContactAddressSelectedCallback` | Uses partial contact only to evaluate shipping eligibility. Returns current totals/methods for Germany; otherwise returns `ApplePayError('shippingContactInvalid', 'countryCode', …)` and no available shipping methods. No payment submission. |
| `shippingMethodSelectedCallback` | Validates method identifier and recalculates item/shipping line items and total. No payment submission. |
| `processPaymentCallback` | Passes the untouched final Apple payment and selected shipping ID to injected `submit`. The page adapter maps final contacts/token into one product-302 Commerce order. |
| `resultCallback` | Preserves backend `succeeded`, `pending`, `requires-action` or `failed`. Wallet approval is not payment proof. |
| `cancelCallback` / `errorCallback` | Resets the selected method to Standard for a subsequent sheet and invokes the host callback. A previously submitted order is never automatically retried. |

The request requires final shipping `postalAddress`, `name`, `email`, `phone` and billing `postalAddress`, `name`. The final order adapter validates complete contacts independently of the preview callbacks. Demo prices/countries must be changed together with backend validation, not just in the wallet callbacks.

## Browser lifecycle

`PCPApplePaySession` waits for the official Apple web SDK before checking capability. Compatible third-party browsers can therefore use Apple's code-scan/device handoff. Apple controls actual browser, device, wallet and region eligibility; this is the same client flow, not an additional demo page.

Callbacks remain in the SDK wrapper as session event handlers. Only the Apple payment-request data is passed to Apple's constructor, so cross-browser `postMessage` can structured-clone the request. `destroy()` removes the owned button and aborts an active sheet; it does not reverse a submitted backend payment.

## Check this flow

- Verify partial address updates never submit an order.
- Switch shipping both ways and compare wallet total, line items and backend amount.
- Choose an unsupported country and verify the wallet's address error.
- Cancel before authorization and confirm no order was created.
- Exercise pending/further-action/failed backend results and reload after submission to check duplicate protection.
- On a compatible desktop browser, verify actual device handoff as well as the direct Safari flow.

See [test evidence](../docs/express-checkout-test-report.md) for executed checks and remaining real-wallet scenarios.
