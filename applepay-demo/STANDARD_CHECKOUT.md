# Apple Pay Standard Checkout

Read [`src/main.ts`](src/main.ts) from top to bottom.

1. Validate `ConfigService`, create `CommerceApiService(config.backendUrl)` and reconcile any saved attempt.
2. Snapshot the merchant form and selected shipping before disabling the controls.
3. Call `PCPApplePaySession.create` directly with the complete request: DE/EUR, version 4, 3DS capability, supported networks and final total/line items. The wallet does not request contact or shipping selection.
4. `processPaymentCallback` maps the actual Apple token and uses the frozen merchant contact. It saves a marker, then submits the visible full auto-executed CommerceCase with product 302/SALE.
5. Save checkout IDs and display the backend result after the wallet closes; follow any required 3DS redirect.
6. Reconcile after return using “Check payment status”.

Billing and delivery use the same merchant form. The sample total is €24.80 or €29.80. Before payment submission, “Edit” destroys the button and invalidates old callbacks; after submission, status reconciliation replaces editing. Late initialization and callbacks are handled on navigation.

See [setup and backend contracts](README.md).
