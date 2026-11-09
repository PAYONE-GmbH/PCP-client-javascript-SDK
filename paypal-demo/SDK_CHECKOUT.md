# PayPal SDK Checkout

Read [`src/sdk.ts`](src/sdk.ts) from top to bottom.

1. Validate configuration, reconcile any existing attempt, then enable the merchant form.
2. Freeze the contact/shipping snapshot and load the official `@paypal/paypal-js` button.
3. The button's `createOrder` callback sends the visible PAYONE CommerceCase request once. It uses `javaScriptSdkFlow: true`; `config.intent` controls both PayPal's `capture`/`authorize` setting and PAYONE's `requiresApproval` flag.
4. Return only `payPalTransactionId` to the button. Never substitute the PAYONE payment ID.
5. Approval, cancellation or an error for a known order synchronizes PAYONE exactly once through `complete-order`:

```json
{
  "completePaymentMethodSpecificInput": {
    "paymentProduct840SpecificInput": {
      "javaScriptSdkFlow": true,
      "action": "CONFIRM_ORDER_STATUS"
    }
  }
}
```

6. If completion did not fail, GET the existing checkout and display its backend state.

Callbacks validate order-ID correlation and share the in-flight order/completion. Persisted markers prevent replay after uncertain POSTs or reload. The browser never calls PayPal `actions.order.capture()` or `authorize()`.

Before order creation, “Edit” closes the button and invalidates its callbacks. `pagehide` closes it too; late callbacks are ignored. Authorization-only payments remain pending until a separate server-side capture.

See [SDK identifiers and backend requirements](README.md).
