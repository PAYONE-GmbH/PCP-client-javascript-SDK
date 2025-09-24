import { loadScript } from '@paypal/paypal-js';
loadScript({
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
  merchantId: import.meta.env.VITE_PAYPAL_MERCHANT_ID,
  currency: 'EUR',
  intent: 'authorize',
  locale: 'de_DE',
  commit: true,
  vault: false,
  disableFunding: ['card', 'sepa', 'bancontact'],
  enableFunding: ['paylater'],
  debug: true,
})
  .then((paypal) => {
    if (!paypal) {
      throw new Error('PayPal SDK could not be loaded.');
    }
    // start to use the PayPal JS SDK script
    paypal
      .Buttons?.({
        async createOrder() {
          const response = await fetch(import.meta.env.VITE_CREATE_ORDER_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cart: [
                {
                  sku: 'YOUR_PRODUCT_STOCK_KEEPING_UNIT',
                  quantity: 'YOUR_PRODUCT_QUANTITY',
                },
              ],
            }),
          });

          const order = await response.json();

          return order.id;
        },
        onApprove: async (data, _actions) => {
          // Call your server to capture the order
          const response = await fetch(import.meta.env.VITE_ON_APPROVE_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderID: data.orderID,
            }),
          });

          if (!response.ok) {
            throw new Error(
              `Server responded with ${response.status}: ${response.statusText}`,
            );
          }
          const responseData = await response.json();
          console.log('Order captured successfully:', responseData);
        },
        onError: (error) => {
          console.error('PayPal error:', error);
          document.getElementById('error')!.textContent =
            error.message as string;
        },
        onCancel: () => {
          console.log('Payment cancelled');
          document.getElementById('message')!.textContent =
            'Payment cancelled by user';
        },
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
        },
      })
      .render('#paypal-button-container');
  })
  .catch((err) => {
    console.error('failed to load the PayPal JS SDK script', err);
  });
