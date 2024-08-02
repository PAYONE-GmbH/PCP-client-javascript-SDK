# PayOne PCP JavaScript Client SDK

**NOTE:** This SDK is still under development. Some things may be broken, features may change in non-compatible ways or will be removed completely.

Welcome to the PayOne PCP JavaScript Client SDK for the PayOne PCP platform. This SDK provides everything a client needs to easily complete payments using Credit or Debit Card, PAYONE Buy Now Pay Later (BNPL) and Apple Pay.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Credit Card Tokenizer](#credit-card-tokenizer)
  - [Fingerprinting Tokenizer](#fingerprinting-tokenizer)
  - [Apple Pay Session Integration](#apple-pay-session-integration)
  - [PCP Compliant Interfaces](#pcp-compliant-interfaces)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Credit Card Tokenizer**: Securely tokenize credit and debit card information.
- **Fingerprinting Tokenizer**: Generate unique tokens for device fingerprinting.
- **Apple Pay Session Integration**: Seamlessly integrate Apple Pay into your payment workflow.

## Installation

To install the PayOne PCP JavaScript Client SDK, use npm:

```bash
npm install pcp-client-javascript-sdk
```

## Usage

### Credit Card Tokenizer

To integrate the Credit Card Tokenizer feature into your application, follow these steps:

1. **Setup Input Containers and Submit Button:**

   - Create a container for each input iframe. For example:
     ```html
     <div id="cardpanInput"></div>
     <div id="cardcvc2Input"></div>
     <div id="cardExpireMonthInput"></div>
     <div id="cardExpireYearInput"></div>
     ```
   - Create a submit button to trigger the credit card check:
     ```html
     <button id="submit">Submit</button>
     ```
   - If you want to use the credit card icons from the Payone CDN, make sure to have a container for them:
     ```html
     <div id="ccIcons"></div>
     ```

2. **Import Tokenizer and Types from the SDK:**

   ```typescript
   import {
     PCPCreditCardTokenizer,
     Config,
     Request,
   } from 'pcp-client-javascript-sdk';
   ```

3. **Configuration Object:**

   - Define a configuration object to set up the styles, auto card type detection, credit card icons, and callbacks. Here is an example:
     ```typescript
     const config: Config = {
       fields: {
         cardpan: { selector: '#cardpanInput', type: 'text' },
         cardcvc2: {
           selector: '#cardcvc2Input',
           size: '4',
           maxlength: '4',
           type: 'password',
           length: { V: 3, M: 3, A: 4, J: 0 },
         },
         cardexpiremonth: { selector: '#cardExpireMonthInput', type: 'text' },
         cardexpireyear: { selector: '#cardExpireYearInput', type: 'text' },
       },
       defaultStyle: {
         input: 'font-size: 1em; border: 1px solid #000; width: 175px;',
         inputFocus: 'border: 1px solid #00f;',
         select: 'font-size: 1em; border: 1px solid #000; width: 175px;',
         iframe: {
           width: '100%',
           height: '40px',
         },
       },
       autoCardtypeDetection: {
         supportedCardtypes: ['V', 'M', 'A', 'D', 'J'],
         callback: (detectedCardtype) => {
           console.log(`Detected card type: ${detectedCardtype}`);
         },
       },
       language: 'de',
       submitButtonId: 'submit',
       ccIcons: {
         selector: '#ccIcons',
         mapCardtypeToSelector: {
           V: '#visa',
           M: '#mastercard',
           A: '#american-express',
           D: '#diners-club',
           J: '#jcb',
         },
         style: {
           height: '20px',
           width: '30px',
         },
       },
       creditCardCheckCallback: (response) => {
         console.log('Credit card check response:', response);
         // Handle the response as needed
       },
     };
     ```

4. **Request Object:**

   - Define a request object to configure the credit card check request:
     ```typescript
     const request: Request = {
       request: 'creditcardcheck',
       responsetype: 'JSON',
       mode: 'test',
       mid: 'your-merchant-id',
       aid: 'your-account-id',
       portalid: 'your-portal-id',
       encoding: 'UTF-8',
       storecarddata: 'yes',
       api_version: '3.10',
     };
     ```

5. **Initialize the Credit Card Tokenizer:**

   - Initialize the Credit Card Tokenizer with the configuration and request objects, along with your PMI Portal Key:
     ```typescript
     const pmiPortalKey = 'your-pmi-portal-key';
     const creditCardTokenizer = await PCPCreditCardTokenizer.create(
       config,
       request,
       pmiPortalKey,
     );
     ```

6. **Handle Credit Card Input and Submission:**
   - When the user enters valid credit card information and clicks the submit button, the `creditCardCheckCallback` will be triggered, providing the response with all necessary information for the server to continue the credit card payment process.

For further information see: https://docs.payone.com/integration/channel-client-api/client-api-hosted-iframe-mode

### Fingerprinting Tokenizer

To integrate the Fingerprinting Tokenizer feature into your application, follow these steps:

1. **Import Tokenizer from the SDK:**

   ```typescript
   import { PCPFingerprintingTokenizer } from 'pcp-client-javascript-sdk';
   ```

2. **Setup Selector for Script and Link Tag:**

   - Ensure you have a selector for the script and link tag. You can use a specific element or simply use the `body` as the selector:
     ```html
     <div id="fingerprintContainer"></div>
     ```
   - Alternatively, you can use the `body` selector:
     ```html
     <body></body>
     ```

3. **Create a New Fingerprinting Tokenizer Instance:**

   - Initialize a new `FingerprintingTokenizer` instance by invoking the static create method with the appropriate parameters, including a unique session ID for each checkout experience. If you don't have a session ID, you can generate one using a GUIDv4 function or let the SDK generate it automatically:

     ```typescript
     const selector = '#fingerprintContainer'; // or 'body'
     const environment = 't'; // 't' for test, 'p' for production
     const paylaPartnerId = 'your-payla-partner-id';
     const partnerMerchantId = 'your-partner-merchant-id';
     const sessionId = yourUniqueSessionId || generateGUIDv4() || undefined; // Optional: You can pass a unique session ID or let the SDK generate one

     const fingerprintingTokenizer = await PCPFingerprintingTokenizer.create(
       selector,
       environment,
       paylaPartnerId,
       partnerMerchantId,
       sessionId,
     );
     ```

4. **Get Snippet Token:**

   - Once the scripts are loaded, you can obtain the snippet token required for the PAYONE BNPL payment process by calling:
     ```typescript
     const token = fingerprintingTokenizer.getSnippetToken();
     ```
   - This snippet token is automatically generated when the `PCPFingerprintingTokenizer` instance is created and is also stored by Payla for payment verification. You need to send this snippet token to your server so that it can be included in the payment request. Add the token to the property `paymentMethodSpecificInput.customerDevice.deviceToken`.

5. **(Optional) Get Unique ID:**
   ```typescript
   const sessionID = fingerprintingTokenizer.getUniqueId();
   ```

For further information see: https://docs.payone.com/pcp/commerce-platform-payment-methods/payone-bnpl/payone-secured-invoice

### Apple Pay Session Integration

See: [Apple Pay Session Demo README](./applepay-demo/README.md)

### PCP Compliant Interfaces

In addition to the Client-SDK, we also provide a Server-SDK. If you want to directly expose PCP compliant objects from your client, you can find all the necessary interfaces within the interfaces folder.

Example:

```typescript
import type { CreateCheckoutRequest } from 'pcp-client-javascript-sdk';

const createCheckoutRequest: CreateCheckoutRequest = {...}
```

---

You can find demonstration projects for each feature in the corresponding directories:

- **Credit Card Tokenizer**: Check out the `creditcard-tokenizer-demo` folder.
- **Fingerprinting Tokenizer**: See the `fingerprinting-tokenizer-demo` folder.
- **Apple Pay Session Integration**: Refer to the `applepay-demo` folder.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

This project is licensed under the MIT License. For more details, see the [LICENSE](./LICENSE) file.
