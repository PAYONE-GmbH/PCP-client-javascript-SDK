# PAYONE Commerce Platform Client JavaScript SDK

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=PAYONE-GmbH_PCP-client-javascript-SDK&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=PAYONE-GmbH_PCP-client-javascript-SDK)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=PAYONE-GmbH_PCP-client-javascript-SDK&metric=coverage)](https://sonarcloud.io/summary/new_code?id=PAYONE-GmbH_PCP-client-javascript-SDK)

<!--
TODO: comment in and remove the NOTE below when published on npm
[![npm](https://img.shields.io/npm/v/@payone/pcp-client-javascript-sdk)](https://www.npmjs.com/package/@payone/pcp-client-javascript-sdk)
[![npm downloads](https://img.shields.io/npm/dw/@payone/pcp-client-javascript-sdk)](https://www.npmjs.com/package/@nanogiants/pcp-client-javascript-sdk) -->

**NOTE:** This SDK is still under development. Some things may be broken, features may change in non-compatible ways or will be removed completely.

Welcome to the PAYONE Commerce Platform Client JavaScript SDK for the PAYONE Commerce Platform. This SDK provides everything a client needs to easily complete payments using Credit or Debit Card, PAYONE Buy Now Pay Later (BNPL) and Apple Pay.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Credit Card Tokenizer](#credit-card-tokenizer)
    - [1. Setup Input Containers and Submit Button](#1-setup-input-containers-and-submit-button)
    - [2. Import Tokenizer and Types from the SDK](#2-import-tokenizer-and-types-from-the-sdk)
    - [3. Configuration Object](#3-configuration-object)
    - [4. Request Object](#4-request-object)
    - [5. Initialize the Credit Card Tokenizer](#5-initialize-the-credit-card-tokenizer)
    - [6. Handle Credit Card Input and Submission](#6-handle-credit-card-input-and-submission)
  - [Fingerprinting Tokenizer](#fingerprinting-tokenizer)
    - [1. Import Tokenizer from the SDK](#1-import-tokenizer-from-the-sdk)
    - [2. Setup Selector for Script and Link Tag](#2-setup-selector-for-script-and-link-tag)
    - [3. Create a New Fingerprinting Tokenizer Instance](#3-create-a-new-fingerprinting-tokenizer-instance)
    - [4. Get Snippet Token](#4-get-snippet-token)
    - [5. (Optional) Get Unique SessionID](#5-optional-get-unique-sessionid)
  - [Apple Pay Session Integration](#apple-pay-session-integration)
    - [1. Setup Your Server and Environment](#1-setup-your-server-and-environment)
    - [2. Setup Selector for Apple Pay Button](#2-setup-selector-for-apple-pay-button)
    - [3. Import PCPApplePaySession and Types from the SDK](#3-import-pcpapplepaysession-and-types-from-the-sdk)
    - [4. Session Configuration Object](#4-session-configuration-object)
    - [5. Apple Pay Button Configuration](#5-apple-pay-button-configuration)
    - [6. Integrating the Apple Pay Session](#6-integrating-the-apple-pay-session)
  - [PAYONE Commerce Platform Compliant Interfaces](#payone-commerce-platform-compliant-interfaces)
- [Demonstration Projects](#demonstration-projects)
- [Contributing](#contributing)
- [Releasing](#releasing)
  - [How to use the prepare_release.sh script](#how-to-use-the-prepare_releasesh-script)
  - [Changelog Generation with Conventional Changelog](#changelog-generation-with-conventional-changelog)
  - [GitHub Action for Release](#github-action-for-release)
- [Minimum Supported Browser Versions](#minimum-supported-browser-versions)
- [License](#license)

## Features

- **Credit Card Tokenizer**: Securely tokenize credit and debit card information.
- **Fingerprinting Tokenizer**: Generate unique tokens for device fingerprinting.
- **Apple Pay Session Integration**: Seamlessly integrate Apple Pay into your payment workflow.

## Installation

To install the PAYONE Commerce Platform Client JavaScript SDK, you can use either `npm`, `yarn`, or `pnpm`. Choose the command that corresponds to your package manager:

**Using npm:**

```bash
npm install pcp-client-javascript-sdk
```

**Using yarn:**

```bash
yarn add pcp-client-javascript-sdk
```

**Using pnpm:**

```bash
pnpm add pcp-client-javascript-sdk
```

**[back to top](#table-of-contents)**

## Usage

### Credit Card Tokenizer

The Credit Card Tokenizer is an essential component for handling payments on the PAYONE Commerce Platform. It securely collects and processes credit or debit card information to generate a `paymentProcessingToken`, which is required for the Server-SDK to complete the payment process. Without this token, the server cannot perform the transaction. The tokenizer ensures that sensitive card details are handled securely and is PCI DSS (Payment Card Industry Data Security Standard) compliant.

To integrate the Credit Card Tokenizer feature into your application, follow these steps:

#### 1. **Setup Input Containers and Submit Button:**

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

#### 2. **Import Tokenizer and Types from the SDK:**

```typescript
import {
  PCPCreditCardTokenizer,
  Config,
  Request,
} from 'pcp-client-javascript-sdk';
```

#### 3. **Configuration Object:**

The configuration object sets up styles, auto card type detection, credit card icons, and callbacks.

<details>
  <summary>Example Configuration Object:</summary>
  
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
</details>

Below are the details for each field in the configuration object:

#### Property: fields

Defines the various input fields for credit card details.

| Property          | Type                             | Description                                        |
| ----------------- | -------------------------------- | -------------------------------------------------- |
| `cardpan`         | `FieldConfig`                    | Configuration for the card number field.           |
| `cardcvc2`        | `FieldConfig`                    | Configuration for the card CVC2 field.             |
| `cardexpiremonth` | `FieldConfig`                    | Configuration for the card expiration month field. |
| `cardexpireyear`  | `FieldConfig`                    | Configuration for the card expiration year field.  |
| `cardtype`        | `CardtypeFieldConfig` (optional) | Configuration for the card type field.             |

##### FieldConfig

- **selector**: `string`  
  The CSS selector for the input element.

- **element**: `HTMLElement` (optional)  
  The actual DOM element if not using a selector.

- **size**: `string` (optional)  
  The size attribute for the input element.

- **maxlength**: `string` (optional)  
  The maximum length of input allowed.

- **length**: `{ [key: string]: number }` (optional)  
  Specifies the length for various card types (e.g., `{ V: 3, M: 3, A: 4, J: 0 }`).

- **type**: `string`  
  The type attribute for the input element (e.g., `text`, `password`).

- **style**: `string` (optional)  
  CSS styles applied to the input element.

- **styleFocus**: `string` (optional)  
  CSS styles applied when the input element is focused.

- **iframe**: `{ width?: string; height?: string }` (optional)  
  Dimensions for the iframe if used.

##### CardtypeFieldConfig

- **selector**: `string`  
  The CSS selector.

- **element**: `HTMLElement` (optional)  
  The actual DOM element if not using a selector.

- **cardtypes**: `string[]`  
  List of supported card types (e.g., `['V', 'M', 'A', 'D', 'J']`). The new card type "#" enforces user selection and displays "Please select" initially.

#### Property: defaultStyle

Defines the default styling for various elements.

| Property     | Type                                  | Description                            |
| ------------ | ------------------------------------- | -------------------------------------- |
| `input`      | `string`                              | CSS styles for input elements.         |
| `inputFocus` | `string`                              | CSS styles for focused input elements. |
| `select`     | `string`                              | CSS styles for select elements.        |
| `iframe`     | `{ width?: string; height?: string }` | Dimensions for the iframe.             |

#### Property: autoCardtypeDetection

Configuration for automatic card type detection.

| Property             | Type                                 | Description                                           |
| -------------------- | ------------------------------------ | ----------------------------------------------------- |
| `supportedCardtypes` | `string[]`                           | List of supported card types.                         |
| `callback`           | `(detectedCardtype: string) => void` | Callback function triggered upon card type detection. |
| `deactivate`         | `boolean` (optional)                 | If true, deactivates auto card type detection.        |

#### Additional Configurations

| Property                           | Type                                                                                                                                                       | Description                                                                                                                                            |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `language`                         | `string`                                                                                                                                                   | The language for the SDK (e.g., `'de'`).                                                                                                               |
| `submitButton`                     | `SubmitButtonConfig`                                                                                                                                       | Configuration for the submit button.                                                                                                                   |
| `submitButtonWithOutCompleteCheck` | `SubmitButtonConfig` (optional)                                                                                                                            | Configuration for the submit button that skips the completeness check.                                                                                 |
| `ccIcons`                          | `CreditCardIconsConfig` (optional)                                                                                                                         | Configuration for loading credit card icons from the Payone CDN and mounting them on the specified selector with individual selectors for easy access. |
| `error`                            | `string` (optional)                                                                                                                                        | The name of the div-container where error messages should be displayed.                                                                                |
| `creditCardCheckCallback`          | `(response: { [key: string]: string; status: string; pseudocardpan: string; truncatedcardpan: string; cardtype: string; cardexpiredate: string }) => void` | Callback function for credit card check responses.                                                                                                     |
| `formNotCompleteCallback`          | `() => void` (optional)                                                                                                                                    | Callback function triggered when the form is not complete.                                                                                             |
| `payOneScriptId`                   | `string` (optional)                                                                                                                                        | The ID for the Payone script to be loaded. Defaults to `payone-hosted-script`.                                                                         |

##### SubmitButtonConfig

- **selector**: `string` (optional)  
  The CSS selector for the submit button.

- **element**: `HTMLElement` (optional)  
  The actual DOM element if not using a selector.

##### CreditCardIconsConfig

- **selector**: `string` (optional)  
  The CSS selector for the container of the credit card icons.

- **element**: `HTMLElement` (optional)  
  The actual DOM element if not using a selector.

- **mapCardtypeToSelector**: `Partial<Record<Cardtype, string>>` (optional)  
  Maps card types to their corresponding icon selectors (e.g., `{ V: '#visa', M: '#mastercard' }`).

- **style**: `{ [key: string]: string | undefined; height?: string; width?: string; }` (optional)  
  CSS styles for the icons (e.g., `{ height: '20px', width: '30px' }`).

#### Card Types

The `Cardtype` enum defines the supported credit card types within the SDK. Each card type corresponds to a particular credit card brand and has specific BIN (Bank Identification Number) ranges for automatic detection. The following table provides details on each card type, its value, and the BIN ranges used for automatic detection:

| Cardtype | Value                 | BIN Range                              | Comment                                                     |
| -------- | --------------------- | -------------------------------------- | ----------------------------------------------------------- |
| `V`      | Visa                  | 4                                      |                                                             |
| `M`      | MasterCard            | 51-55, 2221-2720                       |                                                             |
| `A`      | American Express      | 34, 37                                 |                                                             |
| `D`      | Diners / Discover     | 300-305, 3095, 36, 38, 39, 601, 64, 65 |                                                             |
| `J`      | JCB                   | 3528-3589                              |                                                             |
| `O`      | Maestro International | 50, 56-58, 602, 61, 620, 627, 63, 67   |                                                             |
| `P`      | China Union Pay       | 62212600-62299800, 624-626, 6282-6288  |                                                             |
| `U`      | UATP / Airplus        | 1220, 1920                             | Coming soon; not available yet                              |
| `G`      | girocard              | 68                                     | Currently only viable for e-commerce payments via Apple Pay |

The `Cardtype` values are used within the configuration object to specify the supported card types for various fields and functionalities, such as the automatic card type detection and the selection of credit card icons.

#### 4. **Request Object:**

The `Request` object is a crucial component used to initiate a credit card check via the PAYONE API. Below are the detailed instructions on how to construct the `Request` object, including descriptions of its properties and their required values.

#### Example Request Object

```typescript
const request: Request = {
  request: 'creditcardcheck',
  responsetype: 'JSON',
  mode: 'test', // or 'live'
  mid: '123456789', // your Merchant ID
  aid: '987654321', // your Account ID
  portalid: '12340001', // your Portal ID
  encoding: 'UTF-8', // or 'ISO-8859-1'
  storecarddata: 'yes',
  api_version: '3.11',
  checktype: 'TC', // optional, for Deutsche Bahn only
  // The hash is generated by the PAYONE Commerce Platform Client JavaScript SDK.
};
```

#### Request Object Properties

| Attribute       | Value                       | Description                                                                                         |
| --------------- | --------------------------- | --------------------------------------------------------------------------------------------------- |
| `request`       | `'creditcardcheck'`         | Fixed value indicating the type of request.                                                         |
| `responsetype`  | `'JSON'`                    | Fixed value indicating the response format.                                                         |
| `mode`          | `'live'` or `'test'`        | Mode for transactions.                                                                              |
| `mid`           | Your Merchant ID            | Merchant ID                                                                                         |
| `aid`           | Your Account ID             | Account ID                                                                                          |
| `portalid`      | Your Portal ID              | Portal ID                                                                                           |
| `encoding`      | `'ISO-8859-1'` or `'UTF-8'` | Character encoding to be used.                                                                      |
| `storecarddata` | `'yes'` or `'no'`           | Specifies whether a pseudocardnumber shall be generated for later use (e.g. payment request)        |
| `api_version`   | `'3.11'`                    | Recommended API version to be used; it's recommended to use the newest version                      |
| `checktype`     | `'TC'` (optional)           | Configuration valid for Deutsche Bahn only. Indicates starting `creditcardcheck` with travel cards. |
| `hash`          | Generated hash value        | SHA-2 384 hash over request values plus the portal key in your PMI portal configuration.            |

#### Hash Generation

The `hash` attribute is a security feature that ensures the integrity and authenticity of the request. It is generated by creating an HMAC-SHA384 hash of the concatenated request values (in alphabetical order) and your portal key. The PAYONE Commerce Platform Client JavaScript SDK handles the hash generation, so no additional implementation is necessary on your part.

#### 5. **Initialize the Credit Card Tokenizer:**

Initialize the Credit Card Tokenizer with the configuration and request objects, along with your PMI Portal Key:

```typescript
const pmiPortalKey = 'your-pmi-portal-key';
const creditCardTokenizer = await PCPCreditCardTokenizer.create(
  config,
  request,
  pmiPortalKey,
);
```

#### 6. **Handle Credit Card Input and Submission:**

When the user enters valid credit card information and clicks the submit button, the `creditCardCheckCallback` will be triggered, providing the response with all necessary information for the server to continue the credit card payment process.

For further information see: https://docs.payone.com/pcp/commerce-platform-payment-methods/credit-and-debit-card-payments and https://docs.payone.com/integration/channel-client-api/client-api-hosted-iframe-mode

**[back to top](#table-of-contents)**

---

### Fingerprinting Tokenizer

To detect and prevent fraud at an early stage for the secured payment methods, the Fingerprinting Tokenizer is an essential component for handling PAYONE Buy Now, Pay Later (BNPL) payment methods on the PAYONE Commerce Platform. During the checkout process, it securely collects three different IDs to generate a snippetToken in the format `<partner_id>_<merchant_id>_<session_id>`. This token must be sent from your server via the API parameter `paymentMethodSpecificInput.customerDevice.deviceToken`. Without this token, the server cannot perform the transaction. The tokenizer sends these IDs via a code snippet to Payla for later server-to-Payla authorization, ensuring the necessary device information is captured to facilitate secure and accurate payment processing.

To integrate the Fingerprinting Tokenizer feature into your application, follow these steps:

#### 1. **Import Tokenizer from the SDK:**

```typescript
import { PCPFingerprintingTokenizer } from 'pcp-client-javascript-sdk';
```

#### 2. **Setup Selector for Script and Link Tag:**

- Ensure you have a selector for the script and link tag. You can use a specific element or simply use the `body` as the selector:
  ```html
  <div id="fingerprintContainer"></div>
  ```
- Alternatively, you can use the `body` selector:
  ```html
  <body></body>
  ```

#### 3. **Create a New Fingerprinting Tokenizer Instance:**

- Initialize a new `FingerprintingTokenizer` instance by invoking the static `create` method with the appropriate parameters, including a unique session ID for each checkout experience. If you don't have a session ID, you can generate one using a GUIDv4 function or let the SDK generate it automatically:

  ```typescript
  const selector = '#fingerprintContainer'; // or 'body'
  const environment = 't'; // 't' for test, 'p' for production
  const paylaPartnerId = 'your-payla-partner-id';
  const partnerMerchantId = 'your-partner-merchant-id';
  const sessionId = yourUniqueSessionId || generateGUIDv4() || undefined; // Optional: You can pass a unique session ID or let the SDK generate one

  const paylaScriptId = 'your-payla-script-id'; // Optional: The ID for the Payla script element. Default is "paylaDcs"
  const paylaStylesheetId = 'your-payla-stylesheet-id'; // Optional: The ID for the Payla stylesheet element. Default is "paylaDcsStylesheet"

  const fingerprintingTokenizer = await PCPFingerprintingTokenizer.create(
    selector,
    environment,
    paylaPartnerId,
    partnerMerchantId,
    sessionId,
    paylaScriptId,
    paylaStylesheetId,
  );
  ```

#### 4. **Get Snippet Token:**

- Once the scripts are loaded, you can obtain the snippet token required for the special payment process by calling:
  ```typescript
  const token = fingerprintingTokenizer.getSnippetToken();
  ```
- This snippet token is automatically generated when the `PCPFingerprintingTokenizer` instance is created and is also stored by Payla for payment verification. You need to send this snippet token to your server so that it can be included in the payment request. Add the token to the property `paymentMethodSpecificInput.customerDevice.deviceToken`.

#### 5. **(Optional) Get Unique SessionID:**

- If you need to retrieve the unique session ID that was used or generated during the creation of the `PCPFingerprintingTokenizer` instance, you can do so by calling the getUniqueId method:
  ```typescript
  const sessionID = fingerprintingTokenizer.getUniqueId();
  ```

For further information see: https://docs.payone.com/pcp/commerce-platform-payment-methods/payone-bnpl/payone-secured-invoice

**[back to top](#table-of-contents)**

---

### Apple Pay Session Integration

This section guides you through integrating Apple Pay into your web application using the `pcp-client-javascript-sdk`. The integration involves configuring the Apple Pay button and handling the Apple Pay session.

#### 1. **Setup Your Server and Environment**

- Make sure that your server is set up and your environment is configured correctly according to the Apple Developer documentation. Follow the guidelines in the following resources:
  - [Setting Up Your Server](https://developer.apple.com/documentation/apple_pay_on_the_web/setting_up_your_server)
  - [Configuring Your Environment](https://developer.apple.com/documentation/apple_pay_on_the_web/configuring_your_environment)
  - [Maintaining Your Environment](https://developer.apple.com/documentation/apple_pay_on_the_web/maintaining_your_environment)

#### 2. **Setup Selector for Apple Pay Button**

- Ensure you have a selector for the apple pay button element:
  ```html
  <div id="apple-pay-button"></div>
  ```

#### 3. **Import PCPApplePaySession and Types from the SDK**

```typescript
import {
  ApplePayButton,
  encodeToBase64,
  PCPApplePaySession,
  PCPApplePaySessionConfig,
} from 'pcp-client-javascript-sdk';
```

#### 4. **Session Configuration Object**

The PCPApplePaySessionConfig interface extends [ApplePayJS.ApplePayPaymentRequest](https://developer.apple.com/documentation/apple_pay_on_the_web/applepayrequestbase) and includes additional properties required for managing the Apple Pay session.

#### Additional PCPApplePaySessionConfig Properties

| Property                               | Type                                                                                                                   | Description                                                                                                                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| applePayVersion                        | `number`                                                                                                               | The version of Apple Pay on the Web that your website supports. See [version history](https://developer.apple.com/documentation/apple_pay_on_the_web/apple_pay_on_the_web_version_history). |
| validateMerchantURL                    | `string`                                                                                                               | The URL your server must use to validate itself and obtain a merchant session object.                                                                                                       |
| processPaymentURL                      | `string`                                                                                                               | The URL your server must use to process the payment.                                                                                                                                        |
| applePayButtonId                       | `string` (optional)                                                                                                    | The ID for the Apple Pay button element. Default is "apple-pay-button-script".                                                                                                              |
| paymentMethodSelectedCallback          | `(paymentMethod: ApplePayJS.ApplePayPaymentMethod) => Promise<ApplePayJS.ApplePayPaymentMethodUpdate>` (optional)      | Callback function called when the user selects a new payment method.                                                                                                                        |
| couponCodeChangedCallback              | `(couponCode: string) => Promise<ApplePayJS.ApplePayCouponCodeUpdate>` (optional)                                      | Callback function called when the user enters or updates a coupon code.                                                                                                                     |
| shippingMethodSelectedCallback         | `(shippingMethod: ApplePayJS.ApplePayShippingMethod) => Promise<ApplePayJS.ApplePayShippingMethodUpdate>` (optional)   | Callback function called when the user selects a shipping method.                                                                                                                           |
| shippingContactAddressSelectedCallback | `(shippingContact: ApplePayJS.ApplePayPaymentContact) => Promise<ApplePayJS.ApplePayShippingContactUpdate>` (optional) | Callback function called when the user selects a shipping contact in the payment sheet.                                                                                                     |
| cancelCallback                         | `() => void` (optional)                                                                                                | Callback function called when the payment UI is dismissed.                                                                                                                                  |
| errorCallback                          | `(type: ErrorType, error: Error) => void` (optional)                                                                   | Callback function called when an error occurs.                                                                                                                                              |

<details>
  <summary>Example Session Configuration Object:</summary>

```typescript
import {
  PCPApplePaySessionConfig,
  encodeToBase64,
} from 'pcp-client-javascript-sdk';

const applePaySessionConfig: PCPApplePaySessionConfig = {
  applePayVersion: 3,
  countryCode: 'DE',
  currencyCode: 'EUR',
  merchantCapabilities: ['supports3DS'], // mandatory
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
  validateMerchantURL: 'https://your-merchant.url/validate-merchant',
  processPaymentURL: 'https://your-merchant.url/process-payment',
  // A Base64-encoded string used to contain your application-specific data. (See: https://developer.apple.com/documentation/apple_pay_on_the_web/applepayrequest/2951834-applicationdata)
  applicationData: encodeToBase64(
    JSON.stringify({
      foo: 'bar',
    }),
  ),
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
```

</details>

#### 5. **Apple Pay Button Configuration**

You need to configure the appearance and behavior of the Apple Pay button. The `ApplePayButtonConfig` interface allows you to specify the style, type, and locale of the button, as well as additional CSS styles.

#### ApplePayButtonConfig Properties

| Property    | Type                                    | Description                                                                                                                                                                 |
| ----------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| buttonstyle | `'black' \| 'white' \| 'white-outline'` | The appearance of the Apple Pay button. See [button styles](https://developer.apple.com/documentation/apple_pay_on_the_web/applepaybuttonstyle).                            |
| type        | Various types                           | The kind of Apple Pay button. See [button types](https://developer.apple.com/documentation/apple_pay_on_the_web/applepaybuttontype).                                        |
| locale      | `string`                                | The language and region used for the displayed Apple Pay button. See [button locales](https://developer.apple.com/documentation/apple_pay_on_the_web/applepaybuttonlocale). |
| style       | `object`                                | Additional CSS styles to apply to the Apple Pay button.                                                                                                                     |

<details>
  <summary>Example Apple Pay Button Configuration:</summary>

```typescript
import { ApplePayButton } from 'pcp-client-javascript-sdk';

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

</details>

#### 6. **Integrating the Apple Pay Session**

To integrate the Apple Pay session, you need to create an instance of the session using the `PCPApplePaySession.create` method. This method takes the session configuration and the button configuration as parameters.

Example:

```typescript
import {
  ApplePayButton,
  PCPApplePaySession,
  PCPApplePaySessionConfig,
} from 'pcp-client-javascript-sdk';

const applePaySessionConfig: PCPApplePaySessionConfig = {...};
const applePayButton: ApplePayButton = {...};

await PCPApplePaySession.create(applePaySessionConfig, applePayButton);
```

For further information see: https://docs.payone.com/payment-methods/apple-pay

**[back to top](#table-of-contents)**

---

### PAYONE Commerce Platform Compliant Interfaces

In addition to the Client-SDK, we also provide multiple Server-SDKs. If you want to directly expose PAYONE Commerce Platform compliant objects from your client, you can find all the necessary interfaces within the interfaces folder.

Example:

```typescript
import type { CreateCheckoutRequest } from 'pcp-client-javascript-sdk';

const createCheckoutRequest: CreateCheckoutRequest = {...}
```

**[back to top](#table-of-contents)**

---

## Demonstration Projects

You can find demonstration projects for each feature in the corresponding directories:

- **Credit Card Tokenizer**: Check out the [creditcard-tokenizer-demo](./creditcard-tokenizer-demo/) folder.
- **Fingerprinting Tokenizer**: See the [fingerprinting-tokenizer-demo](./fingerprinting-tokenizer-demo/) folder.
- **Apple Pay Session Integration**: Refer to the [applepay-demo](./applepay-demo/) folder.

### Building the SDK

Before running a demo project, you need to build the SDK in the root folder. This is necessary because the `dist` folder that gets created during the build process is targeted by the dependency with `file:..` that is referenced in the credit card tokenizer and fingerprinting tokenizer demo projects.

To build the SDK, run the following command in the root folder:

```sh
npm run build
```

This command compiles the SDK and creates the `dist` folder, making it available for the demo projects to use.

### Environment Variables

All the demos are using `.env` files for passing in sensitive information such as Keys, Identifier, URLs, and other configuration details. If you want to try out these demos, you must add an `.env` (or `.env.local`) file according to the given `.env.example` with your own credentials.

#### VITE\_ Prefix

Each demo app uses Vite as the build tool. Vite exposes environment variables on the special `import.meta.env` object, which are statically replaced at build time. This ensures that the configuration is securely managed and tailored for different environments (development, production, etc.).

Environment variables with the `VITE_` prefix are exposed to your client-side code. This is a security measure to prevent accidental exposure of sensitive data. Vite will only expose variables prefixed with `VITE_`, which ensures that server-only variables are not included in the client bundle.

Example `.env` file for the apple pay demo:

```env
# client demo environment variables
VITE_APPLE_PAY_VALIDATE_MERCHANT_URL=https://your-merchant-domain.de/validate-merchant
VITE_APPLE_PAY_PROCESS_PAYMENT_URL=https://your-merchant-domain.de/process-payment
# server demo environment variables
APPLE_PAY_MERCHANT_IDENTIFIER=merchant.de.your.project
MERCHANT_DOMAIN_WITHOUT_PROTOCOL_OR_WWW=your-merchant-domain.de
```

**[back to top](#table-of-contents)**

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

**[back to top](#table-of-contents)**

## Releasing

To ensure a smooth release process, a pre-release script has been created. This script automates versioning, tagging, and ensuring the working directory is in a proper state before creating a new release. Each release requires creating a new release branch, applying changes there, and verifying the version against the release branch name.

### `prepare_release.sh` Script

The [`prepare_release.sh`](./prepare_release.sh) script is a bash script designed to update the version number in your project, commit the changes, and tag the commit with the new version number.

### How to use the `prepare_release.sh` Script

1. **Create and switch to a new release branch**:

   - Create a release branch named `release/v<version>`.
   - Example:
     ```sh
     git checkout -b release/v1.2.3
     ```

2. **Ensure your working directory is clean**:

   - Make sure you have no uncommitted changes. The script will exit if there are any changes detected.
   - Verify that you are on the `release/v<version>` branch before proceeding.

3. **Run the script with the desired version number**:

   - Open your terminal and navigate to the root directory of your project.
   - Execute the script with the version number as an argument.

   ```sh
   ./prepare_release.sh <version>
   ```

   - Example:

   ```sh
   ./prepare_release.sh 1.2.3
   ```

4. **Script Workflow**:

   - The script checks if a version number is provided and validates its format.
   - It ensures the working directory is clean and that you are on the `release/v<version>` branch.
   - It verifies that the provided version tag matches the release branch name.
   - It updates the version number in `package.json` and `package-lock.json`.
   - Commits the changes with a message "Update version to <version>".
   - Tags the commit with "v<version>".

5. **Handling Mistakes**:
   - If you make a mistake, you can undo the commit and delete the tag by running the following commands:
   ```sh
   git reset --soft HEAD~1
   git tag -d v<version>
   ```

### Changelog Generation with Conventional Changelog

Before calling the `prepare_release.sh` script, it is recommended to manually trigger the changelog generation script (which uses [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog)).

1. **Conventional Commit Messages**:

   - Ensure all commit messages follow the conventional commit format, which helps in automatic changelog generation.
   - Commit messages should be in the format: `type(scope): subject`.

2. **Enforcing Commit Messages**:

   - We enforce conventional commit messages using [Lefthook](https://github.com/evilmartians/lefthook) with [commitlint](https://github.com/conventional-changelog/commitlint).
   - This setup ensures that all commit messages are validated before they are committed.

3. **Generate Changelog**:
   - Run the changelog generation script to update the `CHANGELOG.md` file:
     ```sh
     npm run changelog
     ```
   - Review and commit the updated changelog before proceeding with the release script.

### Merging the Release Branch

1. **Open a Pull Request (PR)**:

   - Open a PR from the `release/v<version>` branch to the `master` branch on GitHub.
   - Include a clear description of the changes and the new version.

2. **Code Review**:

   - Request reviews from team members.
   - Address feedback and make necessary changes.

3. **Merge PR**:

   - Once approved, merge the PR to `master`.

### GitHub Action for Release

After successfully running the `prepare_release.sh` and changelog generation scripts and committing all changes to the `master` branch via a PR, an admin can trigger a GitHub Action to finalize and publish the release. This action ensures that the release process is automated, consistent, and deploys the new release from the `master` branch.

**Triggering the GitHub Action**:

- Only admins can trigger the release action.
- Ensure that all changes are committed to the `master` branch.
- Navigate to the Actions tab on your GitHub repository and manually trigger the release action for the `master` branch.

By following these steps, you can efficiently manage and streamline the release process for the PAYONE Commerce Platform Client JavaScript SDK, ensuring that the new release is published from the `master` branch while maintaining consistency and reliability.

## Minimum Supported Browser Versions

The PAYONE Commerce Platform Client JavaScript SDK targets ES6 (ECMAScript 2015) and supports the following minimum browser versions:

| Browser             | Minimum Supported Version |
| ------------------- | ------------------------- |
| Google Chrome       | 51+                       |
| Mozilla Firefox     | 54+                       |
| Microsoft Edge      | 15+                       |
| Safari              | 10.1+                     |
| Opera               | 38+                       |
| iOS Safari          | 10.3+                     |
| Samsung Internet    | 5.0+                      |
| Android Browser     | 127+                      |
| Opera Mobile        | 80+                       |
| Chrome for Android  | 127+                      |
| Firefox for Android | 127+                      |

These versions ensure compatibility with ES6 features such as arrow functions, classes, template literals, and more.

For optimal performance and access to the latest features, we recommend using the most recent versions of your preferred browser.

**[back to top](#table-of-contents)**

## License

This project is licensed under the MIT License. For more details, see the [LICENSE](./LICENSE) file.

**[back to top](#table-of-contents)**
