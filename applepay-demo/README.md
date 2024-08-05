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
2. Update `validateMerchantURL` and `processPaymentURL` with your own URLs.

### Verify Apple Pay Session

Ensure that `await PCPApplePaySession.create(applePaySessionConfig, applePayButton)` is called with the correct configuration.

## SDK Integration

The demo app leverages the class `PCPApplePaySession`of the `pcp-client-javascript-sdk` to handle Apple Pay sessions. Here's how it works:

1. Pass the correct session configuration and an apple pay button configuration with an existing DOM selector to `await PCPApplePaySession.create(...)`.
2. The SDK will render a pre-configured Apple Pay button on your webpage.
3. Users can open the payment sheet, select payment methods, adjust shipping and billing information, and verify themselves with Face ID or Touch ID.
4. The `onpaymentauthorized` callback returns a payment token along with additional billing and shipping information, which can be used to process the payment with your payment provider.

## Apple Pay Button Configuration

The Apple Pay button can be configured with an `ApplePayButtonConfig` object:

```typescript
export interface ApplePayButtonConfig {
    buttonstyle: 'black' | 'white' | 'white-outline';
    type: 'add-money' | 'book' | 'buy' | 'check-out' | 'continue' | 'contribute' | 'donate' | 'order' | 'pay' | 'plain' | 'reload' | 'rent' | 'set-up' | 'subscribe' | 'support' | 'tip' | 'top-up';
    locale: string;
    style?: {
        width?: string;
        height?: string;
        borderRadius?: string;
        padding?: string;
        boxSizing?: string;
    };
}
```

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

By following these steps, you will have a fully functional demo application that showcases the integration of Apple Pay on the web using the `pcp-client-javascript-sdk`. For any further details, refer to the Apple Developer documentation, the `pcp-client-javascript-sdk` documentation or the source code of the demo app.
