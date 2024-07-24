import {
  ApplePayButton,
  PCPApplePaySession,
  PCPApplePaySessionConfig,
} from 'pcp-client-javascript-sdk';

const init = async () => {
  const applePaySessionConfig: PCPApplePaySessionConfig = {
    countryCode: 'DE',
    currencyCode: 'EUR',
    merchantCapabilities: [
      'supports3DS', // mandatory
    ],
    supportedNetworks: ['visa', 'masterCard', 'amex', 'girocard'],
    total: {
      label: 'Payone Demo',
      type: 'final',
      amount: '200.99',
    },
    validateMerchantURL:
      'https://payone-apple-pay-demo-server.nanogiants-services.de/validate-merchant',
    processPaymentURL:
      'https://payone-apple-pay-demo-server.nanogiants-services.de/process-payment',
    merchantValidationData: {
      merchantIdentifier: 'merchant.de.nanogiants.payonedemo',
      foo: 'bar',
    },
    paymentMethodSelectedCallback: async (paymentMethod) => {
      console.log('paymentMethodSelectedCallback', paymentMethod);
      return {
        newTotal: applePaySessionConfig.total,
      };
    },
    couponCodeChangedCallback: async (couponCode) => {
      console.log('couponCodeChangedCallback', couponCode);
      return {
        newTotal: applePaySessionConfig.total,
      };
    },
    shippingMethodSelectedCallback: async (shippingMethod) => {
      console.log('shippingMethodSelectedCallback', shippingMethod);
      return {
        newTotal: applePaySessionConfig.total,
      };
    },
    shippingContactAddressSelectedCallback: async (shippingContact) => {
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

  new PCPApplePaySession(applePaySessionConfig, applePayButton);
};

init();
