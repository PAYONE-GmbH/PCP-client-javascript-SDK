# Google Pay Standard Checkout

Read [`src/main.ts`](src/main.ts) from top to bottom:

1. Create the API client and connect the status button.
2. Collect merchant contact and shipping; show €24.80 or €29.80.
3. Confirm/freeze the form and create Google's official button with the complete request.
4. On authorization, build the Commerce order using the form snapshot and Google token.
5. Return Google `ERROR` on failure; otherwise close the sheet and show the backend result or follow 3DS.

Google collects only the payment method. **Edit checkout details** removes the button and unlocks the form before an order exists. A saved order blocks another payment; reload/3DS return checks its status. Page unload removes the button and suppresses late result UI.

Manual checks after [setup](README.md#run-locally):

- Invalid form prevents button creation; both shipping choices match Google's final amount.
- Cancel, edit and confirm again: one button and the updated quote.
- Authorization sends product 320, token encoded once and matching contact/cart totals.
- Concurrent callbacks, timeout and reload do not submit another order.
- 3DS returns in the same tab and performs GET, not another POST.

See [Merchant backend contract](README.md#merchant-backend-contract).
