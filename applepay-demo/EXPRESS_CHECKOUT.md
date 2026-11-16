# Apple Pay Express Checkout

Read [`src/express.ts`](src/express.ts) from top to bottom.

1. Validate configuration and reconcile any saved attempt.
2. Call `PCPApplePaySession.create` directly with the complete DE/EUR request, contact requirements and Standard/Express shipping methods. Initial total: €24.80.
3. Shipping-contact callbacks update quotes only. Unsupported countries return an Apple shipping error. Redacted contact events do not create orders.
4. Shipping-method selection updates the total to €24.80 or €29.80 and retains the selected option.
5. Authorization maps the final token, billing/account contact and complete German delivery address. Save the submission marker, then send the visible CommerceCase payload with matching amount and cart.
6. Save checkout IDs and report the backend payment result after the sheet closes. Reconcile after any 3DS redirect.

Apple encrypted fields are preserved without re-encoding. Cancellation/errors reset shipping for a fresh sheet; submitted attempts remain guarded. The button is destroyed on navigation and late UI callbacks are ignored.

See [setup and backend contracts](README.md).
