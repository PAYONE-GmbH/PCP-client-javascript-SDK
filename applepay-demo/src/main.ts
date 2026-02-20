import {
  type ApplePayButton,
  encodeToBase64,
  PCPApplePaySession,
  type PCPApplePaySessionConfig,
} from 'pcp-client-javascript-sdk';

const init = async () => {
  const applePaySessionConfig: PCPApplePaySessionConfig = {
    applePayVersion: 3,
    countryCode: 'DE',
    currencyCode: 'EUR',
    merchantCapabilities: [
      'supports3DS', // mandatory
    ],
    supportedNetworks: ['visa', 'masterCard', 'amex', 'girocard'],
    total: {
      label: 'Demo',
      type: 'final',
      amount: '200.99',
    },
    requiredBillingContactFields: ['postalAddress', 'name', 'email'],
    requiredShippingContactFields: ['postalAddress', 'name', 'email'],
    shippingMethods: [
      {
        label: 'Standard Shipping',
        amount: '5.00',
        detail: 'Arrives in 5-7 days',
        identifier: 'standard',
      },
      {
        label: 'Express Shipping',
        amount: '10.00',
        detail: 'Arrives in 2-3 days',
        identifier: 'express',
      },
    ],
    validateMerchantURL: import.meta.env.VITE_APPLE_PAY_VALIDATE_MERCHANT_URL,
    processPaymentURL: import.meta.env.VITE_APPLE_PAY_PROCESS_PAYMENT_URL,
    // This data is completely custom and needs to be sent to your server for merchant validation and must be used as a base64 encoded string here for the apple pay server
    applicationData: encodeToBase64(JSON.stringify({ foo: 'bar' })),
    // biome-ignore lint/suspicious/noExplicitAny: <ok>
    paymentMethodSelectedCallback: async (paymentMethod: any) => {
      console.log('paymentMethodSelectedCallback', paymentMethod);
      return {
        newTotal: applePaySessionConfig.total,
      };
    },
    // biome-ignore lint/suspicious/noExplicitAny: <ok>
    couponCodeChangedCallback: async (couponCode: any) => {
      console.log('couponCodeChangedCallback', couponCode);
      return {
        newTotal: applePaySessionConfig.total,
      };
    },
    // biome-ignore lint/suspicious/noExplicitAny: <ok>
    shippingMethodSelectedCallback: async (shippingMethod: any) => {
      console.log('shippingMethodSelectedCallback', shippingMethod);
      return {
        newTotal: applePaySessionConfig.total,
      };
    },
    // biome-ignore lint/suspicious/noExplicitAny: <ok>
    shippingContactAddressSelectedCallback: async (shippingContact: any) => {
      console.log('shippingContactAddressSelectedCallback', shippingContact);
      return {
        newTotal: applePaySessionConfig.total,
      };
    },
    cancelCallback: () => {
      console.log('cancelCallback');
    },
  };

  const applePayButton: ApplePayButton = {
    selector: '#apple-pay-button',
    config: {
      buttonstyle: 'black',
      type: 'plain',
      locale: 'de-DE',
    },
  };

  await PCPApplePaySession.create(applePaySessionConfig, applePayButton);
};

init();
