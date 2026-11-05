# Google Pay Standard Checkout

Entry: [`index.html`](index.html) → [`src/main.ts`](src/main.ts).

## Flow

1. The merchant form collects name, email, phone and a complete German address; the demo uses it for both billing and shipping.
2. The customer chooses Standard or Express shipping. The merchant page immediately shows the corresponding final total, €24.80 or €29.80.
3. **Continue to Google Pay** validates and freezes that form snapshot, then mounts Google's official payment button.
4. The Google sheet requests only the payment method: no wallet shipping address, email or delivery selection. The total is `FINAL`, with tax-inclusive item/shipping lines.
5. `onPaymentAuthorized` attaches the merchant snapshot, maps the original token to product 320 and waits for the merchant backend's Commerce order response.
6. Declines/errors return native `ERROR`. Accepted/pending/3DS outcomes return native `SUCCESS` to close the sheet; after `onLoadPaymentData`, `onResult` displays the real backend state or follows 3DS.
7. Return/status handling uses the shared backend context and never resubmits the order.

The **Edit checkout details** action destroys/removes the owned button and unlocks the form before a submitted order exists. Preparing a replacement requires confirming the form again, avoiding changes to a live wallet quote. After submission the backend attempt guard keeps the checkout locked for reconciliation. Page unload calls `destroy()` and suppresses late UI callbacks.

## Factory API

`createStandardCheckout(options, contact, email, shippingOptionId)` returns `Promise<CheckoutHandle>`. The handle exposes `destroy()`. `contact` is a Google-shaped address supplied by the **merchant**, not an address selected in the Google sheet. It is cloned before button creation, so later form mutations do not affect the authorization.

Minimal use in another TypeScript/Vite page (paths assume a file inside `src/`):

```typescript
import { createStandardCheckout } from './checkout';
import { checkoutPage } from './page';

// The host page supplies #wallet, #status and #check-status elements.
const page = checkoutPage();
if (page) {
  const checkout = await createStandardCheckout(page.options, {
    name: 'Example Buyer',
    phoneNumber: '+49123456789',
    countryCode: 'DE',
    locality: 'Berlin',
    administrativeArea: 'BE',
    postalCode: '10115',
    sortingCode: '',
    address1: 'Example 1',
    address2: '',
    address3: '',
  }, 'buyer@example.test', 'standard');
  window.addEventListener('pagehide', () => checkout.destroy(), { once: true });
}
```

For integration without the demo page adapter, pass `GoogleCheckoutOptions` directly:

| Option | Purpose |
| --- | --- |
| `environment`, `gatewayMerchantId`, optional `merchantId`, `merchantName` | Public Google/PAYONE settings; validate production requirements as `googleConfig()` does |
| `selector` | Existing button container, e.g. `#wallet` |
| `buttonLocale` | Google button language |
| `allowedAuthMethods` | Optional Google auth-method array; defaults to `['CRYPTOGRAM_3DS']`. See the shared README for explicit desktop TEST configuration. |
| `buttonType`, `buttonColor` | Optional Google button appearance; Standard defaults to `pay` / `black` |
| `submit(payment, optionId)` | Async merchant submission returning `ExpressPaymentResult`; no logging or unconditional success |
| `onResult(result)` | Actual backend outcome after the Google sheet finishes |
| `onCancel()` | Cancellation UI; do not assume an already submitted order was cancelled |
| `onError(error)` | Initialization / processing / availability error UI |

`submit()` receives a copy of `PaymentData` with the merchant email/address and billing contact attached for the shared mapper. It retains the original token string and card details. It is called at most once per factory instance, even if Google repeats its authorization callback. The demo's `CommerceBackend` provides the additional cross-page/reload submission guard.

The existing public `PCPGooglePayExpress` adapter intentionally requires shipping callbacks, so Standard uses Google's official button-element rather than constructing a fake Express request. The Standard behavior stays local to this demo and uses the same typed options, quote and backend mapping as Express.

## Manual test scenarios

Complete the [shared setup](README.md#run-locally), configure a test merchant/backend and open `/index.html`:

1. Submit with missing fields: browser validation prevents wallet creation. Use a real test contact; the form is deliberately not prefilled with fake payment data.
2. Choose Standard, then Express shipping: totals must be €24.80 and €29.80. Continue and confirm Google shows the final matching amount without delivery selection.
3. Before submitting a payment, cancel, choose **Edit checkout details**, change shipping and continue again. Confirm only one button is mounted and the new quote is used.
4. Pay with a configured Google test card: inspect the backend's product-320 input and matching cent/cart totals without logging the token. The UI must distinguish pending from captured.
5. Exercise a decline and a network timeout: Google must show an error; repeated callbacks/reload must not produce another POST. Reconcile the original order first.
6. Exercise 3DS with your supported PAYONE/Google test setup, using a challenge card from the currently configured test-card suite. Confirm redirect and return to the same page/tab, followed by GET status, not a second POST.
7. Reload after a submitted order, then navigate to Express: the shared backend attempt must still require reconciliation. Test unavailable Google Pay and confirm a readable status rather than a silent button failure.

See [README.md](README.md#merchant-backend-contract) for exact endpoints, token encoding, response mapping, webhook completion and how to reset a reconciled **test** attempt.
