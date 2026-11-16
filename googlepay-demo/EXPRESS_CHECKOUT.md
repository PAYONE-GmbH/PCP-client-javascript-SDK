# Google Pay Express Checkout

Read [`src/express.ts`](src/express.ts) from top to bottom:

1. Create the API client and connect the status button.
2. Call `PCPGooglePayExpress.create()` with the complete Google request.
3. `paymentDataChangedCallback` updates address/shipping quotes only, from €24.80 to €29.80.
4. `processPaymentCallback` validates final contacts/shipping and builds the Commerce order.
5. Result callbacks show actual backend state or navigate to 3DS.

Intermediate addresses are redacted; do not require street/name for quote updates. Final authorization provides the full shipping/billing contacts and token. Both callbacks have a 30-second deadline. The saved attempt blocks duplicate orders; return/status performs GET. Page unload destroys the SDK button, including after late initialization.

Manual checks after [setup](README.md#run-locally):

- Wallet collects contacts and shipping without a merchant form.
- Repeated shipping/address changes show matching totals and never POST an order.
- Unsupported country and mismatched final shipping choice are rejected.
- Cancel/reopen starts with coherent default shipping.
- Authorization sends one order with final contacts, product 320 and matching totals.
- Timeout/reload blocks another order; 3DS checks the existing checkout through GET.

See [Merchant backend contract](README.md#merchant-backend-contract).
