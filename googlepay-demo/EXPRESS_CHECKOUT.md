# Google Pay Express Checkout

Entry: [`express.html`](express.html) → [`src/express.ts`](src/express.ts).

## Flow

1. Mount the public `PCPGooglePayExpress` SDK button immediately; no merchant contact form is needed.
2. Google opens with an `ESTIMATED` €24.80 total (item €19.90 + default Standard shipping €4.90).
3. Google supplies address/option changes to `paymentDataChangedCallback`. These are quote updates only; there is no Commerce order or token submission yet.
4. Each update returns a complete `newTransactionInfo` with `FINAL` total, currency/country and tax-inclusive `SUBTOTAL`/`LINE_ITEM` display items, together with synchronized shipping options.
5. On authorization, validate the full final shipping address and selected shipping ID against the displayed quote. Use the final email, billing address and shipping address, then submit exactly one Commerce order.
6. The SDK waits for the backend result and maps declines/errors to native Google `ERROR`. Accepted `pending`/`requires-action`/`succeeded` outcomes close the sheet with native `SUCCESS`; `resultCallback` then reports the real payment state to the page.
7. Shared 3DS/status handling performs any issuer redirect, restores same-tab context and reconciles the checkout via GET. Backend/webhook state determines fulfillment.

## Google request and callback details

| Setting | Demo value / reason |
| --- | --- |
| `callbackIntents` | `PAYMENT_AUTHORIZATION`, `SHIPPING_ADDRESS`, `SHIPPING_OPTION` |
| `emailRequired` | `true`, for final customer contact |
| `shippingAddressRequired` | `true`, with `allowedCountryCodes: ['DE']` and phone |
| Card `billingAddressRequired` | `true`, `billingAddressParameters.format: 'FULL'`, with phone |
| `shippingOptionRequired` | `true`, IDs `standard` and `express` |
| Initial total | `ESTIMATED`, €24.80 |
| Callback totals | `FINAL`, €24.80 / €29.80, matching display items |
| Unsupported country | `SHIPPING_ADDRESS_UNSERVICEABLE` returned to Google |
| Unknown / mismatched final option | Error; never silently substitute a shipping rate |

Intermediate Google addresses are redacted and may contain only country, administrative area, locality and postal code. Never require a street/name to calculate those updates, and never use intermediate data to create a customer/order. The factory tolerates Google's initial `shipping_option_unselected` marker, uses Standard as the default, and waits for the complete `PaymentData` in authorization.

The default quote is local to `pricing.ts`. To add an async server quote later, replace the quote boundary and keep the final submission, selected shipping ID, displayed total and server-validated cart consistent. This demo deliberately defines no fictitious quote endpoint. Offers/coupons and pickup are not implemented.

## Factory API

`createExpressCheckout(options)` returns `Promise<CheckoutHandle>`. It wraps the public SDK's `create(config, { selector })`; the handle exposes `destroy()`. All page/backend dependencies are injected through the same `GoogleCheckoutOptions` used by Standard.

Minimal use in another TypeScript/Vite page (inside `src/`):

```typescript
import { createExpressCheckout } from './checkout';
import { checkoutPage } from './page';

// The host page supplies #wallet, #status and #check-status elements.
const page = checkoutPage();
if (page) {
  const checkout = await createExpressCheckout({
    ...page.options,
    buttonType: 'buy',
    buttonColor: 'black',
  });
  window.addEventListener('pagehide', () => checkout.destroy(), { once: true });
}
```

Options include environment, distinct PAYONE/Google merchant IDs, merchant name, button locale, selector and appearance, plus `submit(payment, optionId)`, `onResult`, `onCancel` and `onError`. Express defaults to button type `buy`; see the [Standard option table](STANDARD_CHECKOUT.md#factory-api) for the shared contract. `checkoutPage()` implements `submit` with `googleInput()`, final-contact mapping and the shared `CommerceBackend`.

Destroy the instance before replacing its container. The SDK owns its button, prevents concurrent loads, caches duplicate authorization callbacks during the sheet session and suppresses late callbacks after destruction. The page entry also handles unload while asynchronous SDK initialization is still in flight. Cancellation restores the default local shipping choice for the next opening, but does not cancel a payment already sent to the backend. The backend adapter's stored attempt prevents a second order across both pages/reloads.

## Manual test scenarios

Complete the [shared setup](README.md#run-locally), configure a test merchant/backend and open `/express.html`:

1. Confirm a Google Pay button appears without entering contact details on the page.
2. Open the wallet with a suitable Google test account. Confirm address/email/billing collection and Standard/Express shipping choices.
3. Switch shipping repeatedly: Standard must total €24.80 and Express €29.80. Confirm item/shipping display lines sum exactly to the total and no POST occurs before authorization.
4. Exercise address changes. Intermediate/redacted addresses must update the quote without requiring a street or name; unsupported destinations must be rejected. The final backend request must use the actual full selected contact, not a hardcoded/intermediate address.
5. Cancel before authorization, reopen and verify a coherent default quote and working selection. No Commerce order should have been created.
6. Authorize with a configured test card: exactly one Commerce POST, product 320, original token encoded once, full customer/shipping details, cart totals matching the wallet. Confirm backend `pending` is displayed as pending, rather than paid.
7. Test backend decline and network timeout. Native Google authorization must return `ERROR`; reconcile before another order, including after reload or navigation to Standard.
8. Test a 3DS challenge using a challenge card from the configured PAYONE/Google card suite. Confirm that the sheet closes before issuer navigation and the same-tab return checks the original checkout without another POST.
9. Check captured webhook/backend state before fulfilling the order. If testing in an iframe, verify payment permission at each embedding boundary.

See [README.md](README.md#merchant-backend-contract) for the shared Commerce contract, status mappings, timeout/retry behavior and test-attempt reset instructions.
