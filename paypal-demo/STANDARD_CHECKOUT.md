# PayPal Standard Checkout

Read [`src/main.ts`](src/main.ts) from top to bottom.

1. Validate `ConfigService` and create `CommerceApiService(config.backendUrl)`.
2. Reconcile an existing attempt; otherwise enable the contact form.
3. Snapshot the form and selected shipping before disabling its controls.
4. Persist the submission marker and POST the visible CommerceCase request: product 840, full auto-executed order, `requiresApproval: false`, `addressSelectionAtPayPal: false`, `javaScriptSdkFlow: false`.
5. Store checkout IDs, map the response and follow a PayPal authorization redirect if present.
6. On return, read the existing checkout through “Check payment status”.

Billing and delivery use the merchant form. The sample cart totals €24.80 or €29.80. The form remains locked after submitting, including uncertain errors. No PayPal browser SDK identifiers are needed.

See [setup and backend requirements](README.md).
