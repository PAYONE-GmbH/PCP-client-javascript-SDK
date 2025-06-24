// see https://github.com/google-pay/google-pay-button for more examples
import GooglePayButton from '@google-pay/button-element';

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
    };
    button.onLoadPaymentData = this.onLoadPaymentData;
    shadow.appendChild(button);
  }

  onLoadPaymentData(paymentData: google.payments.api.PaymentData) {
    // This is where you would typically send the payment data to your server for processing
    console.log('load payment data', paymentData);
  }
}

customElements.define('my-google-pay-button', MyGooglePayButton);
