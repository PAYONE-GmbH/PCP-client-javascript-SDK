// see https://github.com/google-pay/google-pay-button for more examples
import GooglePayButton, { type ReadyToPayChangeResponse } from '@google-pay/button-element';

class MyGooglePayButton extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    const button = new GooglePayButton();
    button.environment = 'TEST';
    button.buttonLocale = 'de';
    button.buttonType = 'pay';
    button.paymentRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      shippingAddressRequired: true,
      shippingOptionRequired: true,
      shippingOptionParameters: {
        shippingOptions: [
          {
            id: 'standard',
            label: 'Standard Shipping',
            description: 'Arrives in 5-7 days',
          },
          {
            id: 'express',
            label: 'Express Shipping',
            description: 'Arrives in 2-3 days',
          },
        ],
        defaultSelectedOptionId: 'standard',
      },
      allowedPaymentMethods: [
        {
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['MASTERCARD', 'VISA'],
            billingAddressParameters: {
              format: 'FULL',
            },
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'payonegmbh', // used to get test credit cards for payone in test environment
              gatewayMerchantId: 'exampleGatewayMerchantId',
            },
          },
        },
      ],
      merchantInfo: {
        merchantId: '12345678901234567890',
        merchantName: 'Demo Merchant',
      },
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPriceLabel: 'Total',
        totalPrice: '100.00',
        currencyCode: 'EUR',
        countryCode: 'DE',
      },
      callbackIntents: ['PAYMENT_AUTHORIZATION', 'SHIPPING_ADDRESS', 'SHIPPING_OPTION'],
    };
    button.onLoadPaymentData = this.onLoadPaymentData;
    button.onPaymentDataChanged = this.onPaymentDataChanged;
    button.onPaymentAuthorized = this.onPaymentAuthorized;
    button.onReadyToPayChange = this.onReadyToPayChange;
    button.onCancel = this.onCancel;
    button.onError = this.onError;
    button.onClick = this.onClick;
    shadow.appendChild(button);
  }

  onLoadPaymentData(paymentData: google.payments.api.PaymentData) {
    // This is where you would typically send the payment data to your server for processing
    console.log('load payment data', paymentData);
  }

  onPaymentDataChanged(
    paymentDataChange: google.payments.api.IntermediatePaymentData,
  ): google.payments.api.PaymentDataRequestUpdate {
    // This is where you can handle changes to the payment data, such as shipping address, options or coupon codes
    console.log('payment data changed', paymentDataChange);
    return {
      newTransactionInfo: {
        totalPriceStatus: 'FINAL' as google.payments.api.TotalPriceStatus,
        totalPriceLabel: 'Total',
        totalPrice: '100.00',
        currencyCode: 'EUR',
        countryCode: 'DE',
      },
    };
  }

  onPaymentAuthorized(paymentData: google.payments.api.PaymentData) {
    // This is where you would typically handle the payment authorization with your server
    console.log('payment authorized', paymentData);
    return {
      transactionState: 'SUCCESS' as google.payments.api.TransactionState,
    };
    // Uncomment the following lines to simulate an error response
    // return {
    //   error: {
    //     reason: 'PAYMENT_DATA_INVALID' as google.payments.api.ErrorReason,
    //     message:
    //       'There was an error processing your payment. Please try again later.',
    //     intent: 'PAYMENT_AUTHORIZATION' as google.payments.api.CallbackIntent,
    //   },
    //   transactionState: 'ERROR' as google.payments.api.TransactionState,
    // };
  }

  onReadyToPayChange(result: ReadyToPayChangeResponse) {
    // This is where you can handle changes to the readiness of the payment method
    console.log('Ready to pay:', result);
  }

  onCancel(reason: google.payments.api.PaymentsError) {
    // Handle cancellation of the payment process
    console.log('Payment cancelled:', reason);
  }

  onError(error: Error | google.payments.api.PaymentsError) {
    // Handle errors here
    console.error('Error occurred:', error);
  }

  onClick(event: Event) {
    // Handle button click
    console.log('Button clicked:', event);
  }
}

customElements.define('my-google-pay-button', MyGooglePayButton);
