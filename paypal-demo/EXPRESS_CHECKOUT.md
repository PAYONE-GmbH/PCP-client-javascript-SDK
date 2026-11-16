# PayPal Express Checkout

Read [`src/express.ts`](src/express.ts). It calls `PCPPayPalExpress.create` directly with the application's intent, confirmation and persistence callbacks.

1. Create a PaymentIntent with product 840, `addressSelectionAtPayPal: true` and `javaScriptSdkFlow: false`.
2. Save intent IDs/phase before the SDK navigates to PayPal.
3. On return, resume the saved context and GET the intent. The API service briefly retries incomplete/transient reads. Verify both intent/payment IDs and product 840 before enabling review.
4. Populate the delivery form from PayPal. The customer explicitly reviews and can edit delivery and shipping; this demo supports Germany only.
5. On confirmation, read the form before disabling it and POST the visible auto-executed CommerceCase request. Customer billing/account data comes from PayPal; delivery comes from the reviewed form. Link the order using the original intent's **paymentId**, with `addressSelectionAtPayPal: false`.
6. Save checkout IDs and let `PCPPayPalExpress` persist the result before any further authorization redirect. A changed shipping price can require that redirect.
7. Reconcile the checkout after return. PayPal address selection/approval alone is not payment completion.

The SDK deduplicates confirmation; stored intent/order markers block replacement POSTs after reload. “Cancel local review” clears local intent context only before confirmation. It does not reverse or cancel a provider payment. Late UI updates are suppressed after `pagehide`.

See [setup and backend requirements](README.md).
