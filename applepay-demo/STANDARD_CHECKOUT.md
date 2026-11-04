# Apple Pay Standard Checkout

The single Standard demo is [`index.html`](index.html), initialized by [`src/main.ts`](src/main.ts). Its checkout form belongs to the merchant page. Apple Pay is used to authorize payment after the customer has entered checkout details.

For installation, endpoint parameters, backend contract, shared options and Apple/PAYONE setup references, see the [demo README](README.md).

## Flow

1. Enter name, email, phone and a German street/postal address. This lean example uses one address for both billing and shipping.
2. Select Standard shipping (€4.90, **€24.80 total**) or Express shipping (€9.90, **€29.80 total**).
3. Click **Continue to Apple Pay**. The form validates before wallet initialization. Its fields are then locked to keep the merchant order and wallet total consistent.
4. Click the Apple Pay button and authorize. No shipping/address selection is requested inside Apple Pay. The factory submits the original checkout address snapshot together with Apple's payment token and the selected shipping ID.
5. Follow the displayed backend result or use **Check payment status**. If further authorization is required, the shared result handler redirects and restores status on return.

**Edit checkout details** destroys the prepared wallet button/session and unlocks the form, allowing a fresh configuration. Once an order attempt exists, editing cannot start another payment; first reconcile the existing order. Wallet cancellation preserves the prepared merchant checkout so it can be retried if no order was submitted.

## Reuse the factory

```ts
import { createStandardCheckout } from './src/checkout';
import type { AppleCheckoutOptions } from './src/checkout';

// These callbacks belong to the host application's existing backend/UI.
declare const submitOrder: AppleCheckoutOptions['submit'];
declare const displayResult: AppleCheckoutOptions['onResult'];
declare const displayError: AppleCheckoutOptions['onError'];

const instance = await createStandardCheckout(
  {
    validateMerchantURL: 'https://shop.example/validate-merchant',
    label: 'My shop',
    button: {
      selector: '#wallet',
      config: { buttonstyle: 'black', type: 'buy', locale: 'en-GB' },
    },
    submit: submitOrder,
    onResult: displayResult,
    onCancel: () => { /* Keep merchant checkout details available. */ },
    onError: displayError,
  },
  {
    givenName: 'Example',
    familyName: 'Buyer',
    emailAddress: 'buyer@example.com',
    phoneNumber: '+49301234567',
    addressLines: ['Example Street 1'],
    postalCode: '10115',
    locality: 'Berlin',
    countryCode: 'DE',
  },
  'standard', // or 'express'
);

// When your application removes this checkout:
// instance.destroy();
```

The factory snapshots the contact rather than retaining the mutable form object. `submit(payment, shippingMethodId)` receives the Apple token with the merchant's snapshot in both `billingContact` and `shippingContact`. This is intentional: the merchant checkout owns these details in this example. If your application supports separate addresses, adapt the factory signature/mapping to pass each separately.

## SDK request

`createStandardCheckout` creates a `PCPApplePaySessionConfig` with:

- Germany/EUR, `supports3DS`, configured networks/version/button.
- A final total and item/shipping line items matching the chosen shipping method.
- `validateMerchantURL`, injected async payment callback, result/cancel/error callbacks.
- **No** required wallet contact fields, shipping methods or shipping-selection callbacks.

`src/page.ts` connects the callback to `CommerceBackend.createOrder`. `appleInput` forwards Apple's encrypted token fields to product 302 without re-encoding the payment. `appleCustomer` / `appleContact` map the merchant checkout snapshot into Commerce customer and shipping data. The same cart builder supplies matching amount, merchant references and GOODS/SHIPMENT product types.

## Check this flow

- Choose each shipping option and compare the merchant total, Apple sheet total and submitted amount.
- Edit details before authorizing; verify the re-created wallet uses the new snapshot.
- Cancel before authorization; verify no Commerce order is created.
- Exercise explicit backend failure, pending and further-action responses; none may display paid without authoritative backend confirmation.
- Reload after submission; verify status reconciliation rather than a duplicate order.

The Standard page replaces the former static-button example; there is no separate legacy checkout page.
