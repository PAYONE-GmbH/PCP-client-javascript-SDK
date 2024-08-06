# Apple Pay Demo App

## Introduction

This demo application showcases the integration of Apple Pay on the web using the `pcp-client-javascript-sdk`.

## Features

- **SDK Integration**: The demo uses the `pcp-client-javascript-sdk`, which simplifies the Apple Pay session management. You only need to pass the correct configuration and a DOM selector.
- **Pre-configured Apple Pay Button**: A ready-to-use Apple Pay button appears on your webpage, allowing users to open the payment sheet, select a payment method, adjust shipping and billing information, and verify themselves using Face ID or Touch ID.
- **Payment Token and More**: The `onpaymentauthorized` callback returns not only a payment token but also additional billing and shipping information that can be used to process payments with Payone.

## Setup

### 1. Setting Up Your Server

Follow the official Apple documentation to set up your server for Apple Pay:
[Setting Up Your Server](https://developer.apple.com/documentation/apple_pay_on_the_web/setting_up_your_server)

### 2. Configuring Your Environment

Refer to the Apple guide to configure your environment:
[Configuring Your Environment](https://developer.apple.com/documentation/apple_pay_on_the_web/configuring_your_environment)

## Server Configuration

### Simple Express Server

The demo app uses a simple Express server with the necessary Apple Pay endpoints:

- `/validate-merchant`
- `/process-payment`

### Verified Domain and SSL

Ensure that the app is deployed on a verified domain and that every webpage hosting an Apple Pay button is served over SSL (HTTPS). To verify your domain:

1. Go to the Apple Developer Portal -> Identifiers -> Merchant Identifier -> Select your Identifier -> Merchant Domains.
2. Make sure the `apple-developer-merchantid-domain-association.txt` file is available at `https://your-verified-merchant-domain.de/.well-known/apple-developer-merchantid-domain-association.txt`.

### Apple Pay Merchant Identity Certificate

Create an Apple Pay Merchant Identity Certificate via the Apple Developer Portal. Export the certificate as a `.p12` file and use `openssl` to generate the `.cert.pem` and `.key.pem` files:

```sh
# Generate .cert.pem
openssl pkcs12 -in /path/to/MerchantIdCertificate.p12 -out /path/to/cert.crt.pem -nokeys -legacy

# Generate .key.pem
openssl pkcs12 -in /path/to/MerchantIdCertificate.p12 -out /path/to/cert.key.pem -nocerts -legacy -nodes
```

These files are required for making validation requests against the Apple Pay server.

## Code Configuration

### Adjust `src/main.ts`

1. Adjust the `PCPApplePaySessionConfig` according to your merchant account capabilities
2. Update `validateMerchantURL` and `processPaymentURL` with your own URLs.These URLs should be served over environment variables for better security and flexibility. See: [Dotenv File](/applepay-demo/.env.example)

### Environment Variables

In the demo app, environment variables are used both for the client implementation and the express server.

- **Client-side Variables:** Prefixed with `VITE_` and defined in the .env file. Vite, the build tool used by the demo app, exposes these variables on the special `import.meta.env` object, which are statically replaced at build time. This keeps the configuration dynamic and secure.

- **Server-side Variables:** Defined without the `VITE_` prefix and used directly in the express server configuration.

The .env file should look like this:

```env
# client demo environment variables
VITE_APPLE_PAY_VALIDATE_MERCHANT_URL=https://your-merchant-domain.de/validate-merchant
VITE_APPLE_PAY_PROCESS_PAYMENT_URL=https://your-merchant-domain.de/process-payment

# server demo environment variables
APPLE_PAY_MERCHANT_IDENTIFIER=merchant.de.your.project
MERCHANT_DOMAIN_WITHOUT_PROTOCOL_OR_WWW=your-merchant-domain.de
```

### Verify Apple Pay Session

Ensure that `await PCPApplePaySession.create(applePaySessionConfig, applePayButton)` is called with the correct configuration. This call initializes the Apple Pay session with the specified settings and button configuration.

## SDK Integration

The demo app leverages the `PCPApplePaySession` class from the `pcp-client-javascript-sdk` to handle Apple Pay sessions. Here's how it works:

1. **Pass Configuration:**
   - Pass the correct session configuration (`PCPApplePaySessionConfig`) and an Apple Pay button configuration (`ApplePayButtonConfig`) with an existing DOM selector to `await PCPApplePaySession.create(...)`.
2. **Render Apple Pay Button:**
   - The SDK will render a pre-configured Apple Pay button on your webpage.
3. **User Interaction:**
   - Users can open the payment sheet, select payment methods, adjust shipping and billing information, and verify themselves with Face ID or Touch ID.
4. **Payment Processing:**
   - The `onpaymentauthorized` callback returns a payment token along with additional billing and shipping information, which can be used to process the payment with your payment provider.

## Apple Pay Button Configuration

The Apple Pay button can be configured with an `ApplePayButtonConfig` object. Below is the structure and an example configuration:

### ApplePayButtonConfig Properties

| Property    | Type                                    | Description                                                                                                                                                                 |
| ----------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| buttonstyle | `'black' \| 'white' \| 'white-outline'` | The appearance of the Apple Pay button. See [button styles](https://developer.apple.com/documentation/apple_pay_on_the_web/applepaybuttonstyle).                            |
| type        | Various types                           | The kind of Apple Pay button. See [button types](https://developer.apple.com/documentation/apple_pay_on_the_web/applepaybuttontype).                                        |
| locale      | `string`                                | The language and region used for the displayed Apple Pay button. See [button locales](https://developer.apple.com/documentation/apple_pay_on_the_web/applepaybuttonlocale). |
| style       | `object`                                | Additional CSS styles to apply to the Apple Pay button.                                                                                                                     |

### Example Button Configuration

```typescript
const applePayButton: ApplePayButton = {
  selector: '#apple-pay-button',
  config: {
    buttonstyle: 'black',
    type: 'plain',
    locale: 'de-DE',
    style: {
      width: '100%',
      height: '50px',
      borderRadius: '10px',
    },
  },
};
```

<details>
  <summary>Expand for Full Configuration Example</summary>

```typescript
import {
  ApplePayButton,
  PCPApplePaySession,
  PCPApplePaySessionConfig,
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
    applicationData: {
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
    errorCallback: (type, error) => {
      console.error('Apple Pay Error:', type, error);
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
```

This example demonstrates how to initialize and configure the Apple Pay session using the SDK. Make sure to create a `.env` File and add the environment variables with your actual values for the merchant validation and payment processing URLs.

</details>

## Installation and Build

### Install Dependencies

Run the following command to install all necessary dependencies:

```sh
npm install
```

### Build the Project

To build the project and generate the `/dist` folder, which will be served by the Express server:

```sh
npm run build
```

### Start the Server

Finally, start the Express server:

```sh
npm run start
```

This will launch the demo app and make it accessible for testing Apple Pay integration.

## Conclusion

By following these steps, you will have a fully functional demo application that showcases the integration of Apple Pay on the web using the `pcp-client-javascript-sdk`. For any further details, refer to the [Apple Developer documentation](https://developer.apple.com/documentation/apple_pay_on_the_web), the [`pcp-client-javascript-sdk` documentation](/README.md#apple-pay-session-integration) or the [source code of the demo app](/applepay-demo/src/main.ts).
