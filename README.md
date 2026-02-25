# PAYONE Commerce Platform Client JavaScript SDK

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=PAYONE-GmbH_PCP-client-javascript-SDK&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=PAYONE-GmbH_PCP-client-javascript-SDK)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=PAYONE-GmbH_PCP-client-javascript-SDK&metric=coverage)](https://sonarcloud.io/summary/new_code?id=PAYONE-GmbH_PCP-client-javascript-SDK)
[![npm](https://img.shields.io/npm/v/pcp-client-javascript-sdk)](https://www.npmjs.com/package/pcp-client-javascript-sdk)
[![npm downloads](https://img.shields.io/npm/dw/pcp-client-javascript-sdk)](https://www.npmjs.com/package/pcp-client-javascript-sdk)

Welcome to the PAYONE Commerce Platform Client JavaScript SDK for the PAYONE Commerce Platform. This SDK provides everything a client needs to easily complete payments using Credit or Debit Card, PAYONE Buy Now Pay Later (BNPL) and Apple Pay.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Credit Card Tokenizer](#credit-card-tokenizer)
    - [1. Add the Payment IFrame and Submit Button to your HTML](#1-add-the-payment-iframe-and-submit-button-to-your-html)
    - [2. Import the Tokenizer and Types from the SDK](#2-import-the-tokenizer-and-types-from-the-sdk)
    - [3. Fetch the JWT from your Backend](#3-fetch-the-jwt-token-from-your-backend)
    - [4. Configure the Tokenizer](#4-configure-the-tokenizer)
    - [5. Initialize the Tokenizer](#5-initialize-the-tokenizer)
    - [6. Customization and Callbacks](#6-customization-and-callbacks)
      - [Supported Card Schemes](#supported-card-schemes)
      - [UI Customization](#ui-customization)
      - [Custom Text Configuration (v1.3+)](#custom-text-configuration-v13)
      - [Custom Icons (v1.4)](#custom-icons-v14)
      - [Click to Pay (v1.3+)](#click-to-pay-v13)
    - [7. PCI DSS & Security](#7-pci-dss--security)
    - [8. Migration Note](#8-migration-note)
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
  - [PayPal Integration](#paypal-integration)
    - [1. Install Dependencies](#1-install-paypal-dependencies)
    - [2. Add the PayPal Button Container](#2-add-the-paypal-button-container)
    - [3. Load the PayPal JavaScript SDK](#3-load-the-paypal-javascript-sdk)
    - [4. Configure and Render PayPal Buttons](#4-configure-and-render-paypal-buttons)
    - [5. Handle Payment Processing](#5-handle-payment-processing)
    - [6. Customize Button Appearance](#6-customize-button-appearance)
  - [Google Pay Integration](#google-pay-integration)
    - [Setup Google Pay Integration](#setup-google-pay-integration-web-component-example)
      - [1. Install Dependencies](#1-install-dependencies)
      - [2. Create a Web Component](#2-create-a-web-component)
      - [3. Add the Component to your HTML](#3-add-the-component-to-your-html)
    - [Button Configuration Options](#button-configuration-options)
  - [PAYONE Commerce Platform Compliant Interfaces](#payone-commerce-platform-compliant-interfaces)
- [Demonstration Projects](#demonstration-projects)
- [Contributing](#contributing)
- [Releasing the library](#releasing-the-library)
  - [Preparing the Release](#preparing-the-release)
  - [Changelog Generation with Conventional Changelog](#changelog-generation-with-conventional-changelog)
  - [Merging the Release Branch](#merging-the-release-branch)
  - [GitHub Action for Release](#github-action-for-release)
  - [Optional: Creating a GitHub Release](#optional-creating-a-github-release)
- [Minimum Supported Browser Versions](#minimum-supported-browser-versions)
- [License](#license)

## Features

- **Credit Card Tokenizer**: Securely tokenize credit and debit card information.
- **Fingerprinting Tokenizer**: Generate unique tokens for device fingerprinting.
- **Apple Pay Session Integration**: Seamlessly integrate Apple Pay into your payment workflow.
- **PayPal Integration**: Enable PayPal payment options on your website.

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

The Credit Card Tokenizer uses the PAYONE Hosted Tokenization SDK (v1.4). It securely collects and processes credit or debit card information in a PCI DSS-compliant way via an iframe, returning a token for use in your server-side payment process.

To integrate the Credit Card Tokenizer into your application, follow these steps:

#### 1. **Add the Payment IFrame and Submit Button to your HTML**

```html
<div id="payment-IFrame"></div> <button id="submit">Pay now</button>
```

#### 2. **Import the Tokenizer and Types from the SDK**

```typescript
import {
  type Config,
  type CustomIconsConfig, // v1.4
  type CustomTextConfig,
  type CTPConfig, // Click to Pay (v1.3+)
  PCPCreditCardTokenizer,
  type UIConfig,
} from 'pcp-client-javascript-sdk';
```

#### 3. **Fetch the JWT from your Backend**

You must obtain a JWT from your backend before initializing the tokenizer. This token is required for secure communication with the PAYONE Commerce Platform API.

```typescript
const fetchJwt = async (): Promise<string> => {
  // Fetch the JWT from your backend (CommercePlatform-API)
  // Use the /v1/{merchantId}/authentication-token endpoint
  return '<Token to be retrieved from the CommercePlatform-API>';
};
```

#### 4. **Configure the Tokenizer**

```typescript
const token = await fetchJwt();

const config: Config = {
  iframe: {
    iframeWrapperId: 'payment-IFrame',
    height: 400,
    width: 400,
    zIndex: 9998,
  },
  uiConfig: {
    formBgColor: '#ffffff',
    fieldBgColor: '#ffffff',
    fieldBorder: '1px solid #8f8f8f',
    fieldLabelColor: '#333333',
    fieldTextColor: '#333333',
    fontFamily: 'Arial, sans-serif',
    labelStyle: { fontSize: '16px', fontWeight: '600', fontSizeMobile: '14px' },
    inputStyle: {
      fontSize: '16px',
      fontWeight: 'normal',
      fontSizeMobile: '14px',
    },
    errorValidationStyle: { fontSize: '14px', fontWeight: 'normal' },
    btnBgColor: '#0096d6',
    btnTextColor: '#ffffff',
    inputBorderRadius: '8px',
    inputBorderColorSuccess: '#22C55E',
    inputBorderColorError: '#da0c1f',
  },
  locale: 'de_DE',
  token,
  mode: 'test', // Use 'live' for production

  // v1.4: show or hide the cardholder name field
  showCardholderName: true,

  // v1.4: pre-fill email address (used by Click to Pay for card lookup)
  email: '',

  allowedCardSchemes: [
    'visa',
    'mastercard',
    'amex',
    'diners',
    'discover',
    'jcb',
    'maestro',
    'unionpay',
  ],

  submitButton: { selector: '#submit' },

  tokenizationSuccessCallback: (statusCode, token, cardDetails, inputMode) => {
    console.log('Status:', statusCode); // 201 on success
    console.log('Token:', token);
    console.log('Card Details:', cardDetails); // { cardholderName, cardNumber, expiryDate, cardType }
    console.log('Input Mode:', inputMode); // 'manual', 'register', or 'ClickToPay'
  },
  tokenizationFailureCallback: (statusCode, errorResponse) => {
    console.error('Status:', statusCode); // e.g. 400
    console.error('Error:', errorResponse.error);
  },
};
```

#### 5. **Initialize the Tokenizer**

```typescript
await PCPCreditCardTokenizer.create(config);
```

#### 6. **Customization and Callbacks**

**Core configuration properties:**

| Property                      | Required | Description                                                                                                        |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| `iframe.iframeWrapperId`      | Yes      | ID of the HTML container for the iframe                                                                            |
| `iframe.height`               | No       | Height in pixels or `'auto'` (default: `'auto'`)                                                                   |
| `iframe.width`                | No       | Max width in pixels (default: `400`)                                                                               |
| `iframe.zIndex`               | No       | CSS z-index (default: `9999`)                                                                                      |
| `token`                       | Yes      | JWT obtained from your backend                                                                                     |
| `mode`                        | No       | `'test'` or `'live'` (default: `'test'`)                                                                           |
| `locale`                      | No       | Form language, e.g. `'de_DE'`, `'en_US'` (default: `'de_DE'`)                                                      |
| `submitButton`                | Yes      | `{ selector: '#id' }` or `{ element: HTMLElement }`                                                                |
| `tokenizationSuccessCallback` | Yes      | Called with `statusCode`, `token`, `cardDetails`, `inputMode`                                                      |
| `tokenizationFailureCallback` | Yes      | Called with `statusCode`, `errorResponse`                                                                          |
| `allowedCardSchemes`          | No       | Limit accepted card brands (see [Supported Card Schemes](#supported-card-schemes))                                 |
| `showCardholderName`          | No       | Show/hide the cardholder name field — **v1.4**                                                                     |
| `email`                       | No       | Pre-fill email for Click to Pay card lookup — **v1.4**                                                             |
| `uiConfig`                    | No       | Form styling (see [UI Customization](#ui-customization))                                                           |
| `customTextConfig`            | No       | Custom labels, placeholders, aria-labels and errors per locale (see [Custom Text](#custom-text-configuration-v13)) |
| `customIconsConfig`           | No       | Custom validation icons — **v1.4** (see [Custom Icons](#custom-icons-v14))                                         |
| `CTPConfig`                   | No       | Click to Pay configuration — **v1.3+** (see [Click to Pay](#click-to-pay-v13))                                     |

---

#### Supported Card Schemes

Pass any subset to `allowedCardSchemes`. If omitted or empty, all cards are accepted.

```typescript
allowedCardSchemes: [
  'amex',
  'diners',
  'discover',
  'jcb',
  'maestro',
  'mastercard',
  'visa',
  'unionpay',
];
```

---

#### UI Customization

`uiConfig` accepts the following properties:

| Property                                                                               | Type        | Description                                            |
| -------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------ |
| `formBgColor`                                                                          | `string`    | Background color of the entire form                    |
| `formMarginLeft` / `formMarginRight`                                                   | `string`    | Outer margin of the form                               |
| `fieldBgColor`                                                                         | `string`    | Background color of input fields                       |
| `fieldBorder`                                                                          | `string`    | CSS border for input fields                            |
| `fieldOutline`                                                                         | `string`    | CSS outline on focus/active                            |
| `fieldLabelColor`                                                                      | `string`    | Label text color                                       |
| `fieldPlaceholderColor`                                                                | `string`    | Placeholder text color                                 |
| `fieldTextColor`                                                                       | `string`    | User-entered text color                                |
| `fieldErrorCodeColor`                                                                  | `string`    | Validation error message color                         |
| `fontFamily`                                                                           | `string`    | Font family name                                       |
| `fontUrl`                                                                              | `string`    | URL of a custom or Google font                         |
| `labelStyle`                                                                           | `FontStyle` | `{ fontSize, fontWeight, fontSizeMobile }`             |
| `inputStyle`                                                                           | `FontStyle` | `{ fontSize, fontWeight, fontSizeMobile }`             |
| `errorValidationStyle`                                                                 | `FontStyle` | `{ fontSize, fontWeight, fontSizeMobile }`             |
| `manualEntryFormLabelStyle`                                                            | `FontStyle` | Style for the "Manually enter your card details" label |
| `checkboxLabelStyle`                                                                   | `FontStyle` | Checkbox label font style                              |
| `termsTextStyle`                                                                       | `FontStyle` | Terms text font style                                  |
| `btnBgColor` / `btnTextColor` / `btnBorderColor`                                       | `string`    | Submit button colors                                   |
| `separatorColor` / `separatorTextColor`                                                | `string`    | "Or" separator styling                                 |
| `inputBorderRadius`                                                                    | `string`    | Input field border radius (e.g. `'8px'`)               |
| `inputBorderColorDefault` / `inputBorderColorSuccess` / `inputBorderColorError`        | `string`    | Border colors by state                                 |
| `inputFocusOutline`                                                                    | `string`    | Outline when an input is focused                       |
| `inputPadding`                                                                         | `string`    | Inner padding of input fields                          |
| `iconWidth` / `iconPaddingRight`                                                       | `string`    | Icon sizing                                            |
| `fieldSpacingVertical`                                                                 | `string`    | Gap between form elements                              |
| `labelMarginBottom` / `inputMarginBottom` / `errorMarginBottom` / `buttonMarginBottom` | `string`    | Per-element spacing                                    |

---

#### Custom Text Configuration (v1.3+)

Customize labels, placeholders, aria-labels and error messages per locale:

```typescript
const customTextConfig: CustomTextConfig = {
  en: {
    labels: {
      cardNumber: 'Card Number',
      cardholderName: 'Cardholder Name',
      expiryDate: 'Expiry Date',
      securityCode: 'Security Code',
      // CTP fields: separatorText, manualCardEntryBtnText, formTitle,
      //             email, country, firstName, lastName, mobileNumber,
      //             selectedCountry, addresslevel1, stateProvince, city, zipCode
    },
    placeholders: {
      cardNumber: '1234 5678 9012 3456',
      cardholderName: 'John Doe',
      expiryDate: 'MM/YY',
      securityCode: 'CVV',
      // additional: email, firstName, lastName, mobileNumber,
      //             addressLevel1, stateProvince, city, zipCode
    },
    arialabels: {
      cardNumber: 'Enter your card number',
      cardholderName: 'Enter the name on the card',
      // additional: expiryDate, securityCode, email, country, firstName,
      //             lastName, mobile, addressLevel1, city, stateProvince, zipCode
    },
    errors: {
      cardNumber: {
        isRequired: '...',
        isInvalid: '...',
        isTooShort: '...',
        notSupported: '...',
      },
      cardholderName: { isRequired: '...', isInvalid: '...' },
      expiryDate: { isRequired: '...', isInvalid: '...' },
      securityCode: {
        isRequired: '...',
        amexCardSecurityCodeError: '...',
        generalSecurityCodeError: '...',
      },
      // CTP fields: email, firstName, lastName, country, mobileNumber,
      //             addressLevel1, city, stateProvince, zipCode
    },
  },
  de: {
    /* ... */
  },
  // Any ISO language code is supported via the index signature
};
```

---

#### Custom Icons (v1.4)

Display custom validation icons inside form fields. Supported formats: `svg`, `png`, `jpeg`, `jpg`, `webp`.

```typescript
const customIconsConfig: CustomIconsConfig = {
  // Enable or disable custom validation icons
  useCustomValidationIcons: true,
  // If true (and useCustomValidationIcons is true), the card number field shows
  // the detected card brand icon instead of the validation icon
  showCardBrandIcons: true,
  successIcon: '/icons/valid.svg',
  errorIcon: '/icons/invalid.svg',
};
```

---

#### Click to Pay (v1.3+)

Integrate the Click to Pay wallet payment method. Requires prior onboarding with the card schemes via PAYONE.

```typescript
const ctpConfig: CTPConfig = {
  enableCTP: true,
  enableCustomerOnboarding: true,
  schemeConfig: {
    merchantPresentationName: 'My Shop',
    visaConfig: {
      srcInitiatorId: '<PAYONE-VISA-UUID>',
      srcDpaId: '<MERCHANT-UUID>',
      encryptionKey: '<STRING>',
      nModulus: '<STRING>',
    },
    mastercardConfig: {
      srcInitiatorId: '<PAYONE-MC-UUID>',
      srcDpaId: '<MERCHANT-UUID>',
    },
  },
  transactionAmount: {
    amount: '1999', // in smallest currency unit or decimal — as provided by PAYONE
    currencyCode: 'EUR',
  },
  uiConfig: {
    buttonStyle: 'solid',
    buttonTextCase: 'capitalize',
    buttonAndBadgeColor: '#0096d6',
    buttonAndBadgeTextColor: '#ffffff',
    fontFamily: 'Arial, sans-serif',
    buttonAndInputRadius: '8px',
    cardItemRadius: '8px',
  },
};
```

Add `CTPConfig` to your main config object:

```typescript
const config: Config = {
  // ... other properties
  CTPConfig: ctpConfig,
};
```

#### 7. **PCI DSS & Security**

- The SDK uses a JWT from your backend for secure initialization.
- All card data is collected inside the hosted iframe — it never touches your application code.
- The Hosted Tokenization SDK script is loaded with [Subresource Integrity (SRI)](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) verification.

#### 8. **Migration Note**

If you previously used the classic PAYONE Hosted IFrames, update your integration to use the Hosted Tokenization SDK as shown above. The old `fields`, `defaultStyle`, and related config properties are no longer used.

**For more details, see the [demo project](./creditcard-tokenizer-demo/).**

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

### PayPal Integration

The PAYONE Commerce Platform Client JavaScript SDK provides a demonstration project for PayPal integration. The integration uses the official PayPal JavaScript SDK, which allows for a seamless checkout experience.

#### 1. Install PayPal Dependencies

To start using PayPal, install one of the following packages based on your needs:

**Standard JavaScript:**

```bash
npm install @paypal/paypal-js
```

**React.js:**

```bash
npm install @paypal/react-paypal-js
```

#### 2. Add the PayPal Button Container

**Standard HTML:**

Add a container for the PayPal button in your HTML:

```html
<div id="paypal-button-container"></div>

<!-- Optional: Add message containers for status and errors -->
<div class="message-container">
  <div id="message" class="success"></div>
  <div id="error" class="error"></div>
</div>
```

**React.js:**

For React applications, integrate the PayPal button component:

```jsx
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';

export default function App() {
  return (
    <PayPalScriptProvider options={{ 'client-id': YOUR_CLIENT_ID }}>
      <PayPalButtons />
    </PayPalScriptProvider>
  );
}
```

#### 3. Load the PayPal JavaScript SDK

There are two ways to load the PayPal JavaScript SDK:

**Standard JavaScript:**

Use the PayPal JS package to dynamically load the SDK:

```typescript
import { loadScript } from '@paypal/paypal-js';

loadScript({
  clientId: 'YOUR_PAYPAL_CLIENT_ID',
  merchantId: 'YOUR_PAYPAL_MERCHANT_ID',
  currency: 'EUR',
  intent: 'authorize', // Or 'capture' for immediate payment
  locale: 'de_DE', // Set to your preferred locale
  commit: true, // Show the 'Pay Now' button
  // Optional: Disable certain funding sources
  disableFunding: ['card', 'sepa', 'bancontact'],
  // Optional: Enable specific funding sources
  enableFunding: ['paylater'],
  debug: false, // Set to true for development
})
  .then((paypal) => {
    if (!paypal) {
      throw new Error('PayPal SDK could not be loaded.');
    }

    // Configure and render PayPal buttons here
  })
  .catch((err) => {
    console.error('Failed to load the PayPal JS SDK script', err);
  });
```

**React.js:**

For React applications, use the `PayPalScriptProvider`:

```jsx
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

export default function App() {
  return <PayPalScriptProvider options={{ 'client-id': YOUR_CLIENT_ID }} />;
}
```

The rest of this documentation focuses on integration using ES Modules. For complete Vanilla JS or React-specific implementation details, please refer to the official [PayPal JavaScript SDK Reference](https://developer.paypal.com/sdk/js/reference/).

#### 4. Configure and Render PayPal Buttons

After loading the SDK, configure and render the PayPal buttons:

```typescript
paypal
  .Buttons({
    // Create order via your server that communicates with PAYONE Commerce Platform
    async createOrder() {
      const response = await fetch('YOUR_SERVER_ENDPOINT/create-paypal-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Optional: You can pass additional data needed for order creation
        body: JSON.stringify({
          checkoutId: 'YOUR_CHECKOUT_ID', // If already created
        }),
      });

      // Your server should return the PayPal OrderID (or payPalTransactionId) from PAYONE Commerce Platform
      const order = await response.json();
      return order.id;
    },

    // Handle payment approval
    onApprove: async (data, actions) => {
      // Notify your server about the approved payment
      const response = await fetch(
        'YOUR_SERVER_ENDPOINT/process-paypal-payment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderID: data.orderID,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Server responded with ${response.status}: ${response.statusText}`,
        );
      }

      const responseData = await response.json();
      console.log('Payment processed successfully:', responseData);

      // Update UI or redirect to success page
    },

    // Handle errors
    onError: (error) => {
      console.error('PayPal error:', error);
      document.getElementById('error').textContent = error.message;
    },

    // Handle cancellations
    onCancel: () => {
      console.log('Payment cancelled');
      document.getElementById('message').textContent =
        'Payment cancelled by user';
    },

    // Button style
    style: {
      layout: 'vertical',
      color: 'gold',
      shape: 'rect',
      label: 'paypal',
    },
  })
  .render('#paypal-button-container');
```

#### 5. Integration with PAYONE Commerce Platform

The PayPal integration with the PAYONE Commerce Platform follows this flow:

1. **Create a Checkout**: First, create a checkout using the PAYONE Commerce Platform Server SDK (either together with a Commerce Case or in distinct calls).

2. **Render the PayPal Button**: Use the PayPal JavaScript SDK to render the button on your page.

3. **Handle Customer Selection**: When a customer selects the PayPal button, the SDK triggers a callback to your server.

4. **Generate PayPal OrderID**: Your server communicates with the PAYONE Commerce Platform using the previously created Checkout to retrieve a payPalTransactionId (also referred to as OrderID).

5. **Authenticate and Approve**: The PayPal JavaScript SDK opens a popup window where the customer logs in and approves the payment.

6. **Handle Callbacks**: After the popup closes, you'll receive one of the following callbacks:
   - `onApprove`: Payment was approved
   - `onCancel`: Customer canceled the payment
   - `onError`: An error occurred during payment processing

7. **Update Order Status**: Based on the callback received, send a request to the PAYONE Commerce Platform to update the order status.

8. **Finalize Process**: Once payment is confirmed, initialize the delivery process to capture the amount and deliver goods or services.

#### 6. Customize Button Appearance

You can customize the appearance of your PayPal buttons using the style options:

| Property | Type                                                           | Description                                    |
| -------- | -------------------------------------------------------------- | ---------------------------------------------- |
| layout   | `'vertical' \| 'horizontal'`                                   | Orientation of multiple funding source buttons |
| color    | `'gold' \| 'blue' \| 'silver' \| 'white' \| 'black'`           | Button color scheme                            |
| shape    | `'rect' \| 'pill'`                                             | Button corner style                            |
| label    | `'paypal' \| 'checkout' \| 'buynow' \| 'pay' \| 'installment'` | Text displayed on the button                   |
| height   | `number`                                                       | Button height (px), minimum 25                 |
| tagline  | `boolean`                                                      | Whether to show tagline text below buttons     |

For more information about PayPal integration, refer to:

- [PayPal JavaScript SDK Configuration](https://developer.paypal.com/sdk/js/configuration/)
- [PayPal JavaScript SDK Reference](https://developer.paypal.com/sdk/js/reference/)
- [PAYONE Commerce Platform PayPal SDK Documentation](https://docs.payone.com/pcp/commerce-platform-payment-methods/paypal/paypal-sdk)

**[back to top](#table-of-contents)**

---

### Google Pay Integration

The PAYONE Commerce Platform Client JavaScript SDK provides a demonstration project for Google Pay integration. The integration uses the official Google Pay Button libraries which are available for various frameworks:

- Web Components ([@google-pay/button-element](https://github.com/google-pay/google-pay-button))
- React ([@google-pay/button-react](https://github.com/google-pay/google-pay-button))
- Angular ([@google-pay/button-angular](https://github.com/google-pay/google-pay-button))
- Vue (using the Web Component)
- Svelte (using the Web Component)

Choose the appropriate library based on your framework:

#### Web Components

```bash
npm install @google-pay/button-element
```

#### React

```bash
npm install @google-pay/button-react
```

#### Angular

```bash
npm install @google-pay/button-angular
```

Our demo implementation uses the Web Component version (@google-pay/button-element), but you can adapt the code to use any of the framework-specific versions. The configuration options and payment request structure remain the same across all versions.

#### Setup Google Pay Integration (Web Component Example)

##### 1. **Install Dependencies**

```bash
npm install @google-pay/button-element
```

##### 2. **Create a Web Component**

Create a custom web component that encapsulates the Google Pay button:

```typescript
import GooglePayButton from '@google-pay/button-element';

class MyGooglePayButton extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    const button = new GooglePayButton();

    // Configure the button
    button.environment = 'TEST'; // Use 'PRODUCTION' for live environment
    button.buttonLocale = 'de';
    button.buttonType = 'pay';

    // Configure the payment request
    button.paymentRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
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
              gateway: 'payonegmbh',
              gatewayMerchantId: 'your-merchant-id',
            },
          },
        },
      ],
      merchantInfo: {
        merchantId: 'your-merchant-id',
        merchantName: 'Your Merchant Name',
      },
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPriceLabel: 'Total',
        totalPrice: '100.00',
        currencyCode: 'EUR',
        countryCode: 'DE',
      },
      // Optional: Configure shipping options
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
    };

    // Handle the payment data
    button.onLoadPaymentData = (
      paymentData: google.payments.api.PaymentData,
    ) => {
      console.log('Payment Data:', paymentData);
      // This is where you would typically send the payment data to your server for processing
    };

    shadow.appendChild(button);
  }
}

customElements.define('my-google-pay-button', MyGooglePayButton);
```

##### 3. **Add the Component to your HTML**

```html
<my-google-pay-button></my-google-pay-button>
```

#### Button Configuration Options

| Property       | Type                              | Description                                    |
| -------------- | --------------------------------- | ---------------------------------------------- |
| environment    | `'TEST' \| 'PRODUCTION'`          | The Google Pay environment to use              |
| buttonLocale   | `string`                          | The language for the button (e.g., 'de', 'en') |
| buttonType     | `string`                          | The type of button ('pay', 'buy', etc.)        |
| buttonColor    | `'default' \| 'black' \| 'white'` | The color scheme of the button                 |
| buttonSizeMode | `'static' \| 'fill'`              | How the button should be sized                 |

For more information about customizing the Google Pay Button, refer to:

- [Customize your Google Pay Button](https://developers.google.com/pay/api/web/guides/resources/customize)

For more information about Google Pay integration, refer to:

- [Google Pay Button Element Documentation](https://github.com/google-pay/google-pay-button)
- [Google Pay API Documentation](https://developers.google.com/pay/api/web/overview)

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
- **PayPal Integration**: Refer to the [paypal-demo](./paypal-demo/) folder.
- **Google Pay Integration**: Refer to the [googlepay-demo](./googlepay-demo/) folder.

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

## Releasing the library

### Preparing the Release

- Checkout develop branch
- Create release branch (release/0.1.0)

```sh
git checkout -b release/0.1.0
```

- Apply versioning

```sh
npm version major|minor|patch
```

### Changelog Generation with Conventional Changelog

The changelog gets generated automatically when the npm version gets bumped via `npm version major|minor|patch` within the `version.sh` script.

1. **Conventional Commit Messages**:
   - Ensure all commit messages follow the conventional commit format, which helps in automatic changelog generation.
   - Commit messages should be in the format: `type(scope): subject`.

2. **Enforcing Commit Messages**:
   - We enforce conventional commit messages using [Lefthook](https://github.com/evilmartians/lefthook) with [commitlint](https://github.com/conventional-changelog/commitlint).
   - This setup ensures that all commit messages are validated before they are committed.

### Merging the Release Branch

- Create PR on `develop` branch
- Merge `develop` in `master` branch

### GitHub Action for Release

After successfully merging all changes to the `master` branch, an admin can trigger a GitHub Action to finalize and publish the release. This action ensures that the release process is automated, consistent, and deploys the new release from the `master` branch.

**Triggering the GitHub Action**:

- Only admins can trigger the release action.
- Ensure that all changes are committed to the `master` branch.
- Navigate to the Actions tab on your GitHub repository and manually trigger the release action for the `master` branch.

### Optional: Creating a GitHub Release

Once the release has been published to npm, developers can start using the latest version of the SDK. However, if you want to make the release more visible and include detailed release notes, you can optionally create a GitHub release.

1. **Navigate to the Releases Page**: Go to the "Releases" section of your repository on GitHub.
2. **Draft a New Release**: Click "Draft a new release".
3. **Tag the Release**: Select the version tag that corresponds to the version you just published on npm (e.g., `v0.1.0`).
4. **Release Title**: Add a descriptive title for the release (e.g., `v0.1.0 - Initial Release`).
5. **Auto-Generated Release Notes**: GitHub can automatically generate release notes based on merged pull requests and commit history. You can review these notes, adjust the content, and highlight important changes.
6. **Publish the Release**: Once you're satisfied with the release notes, click "Publish release".

Creating a GitHub release is optional, but it can provide additional context and visibility for your users. For detailed guidance, refer to the [GitHub documentation on managing releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository).

By following these steps, you can efficiently manage and streamline the release process for the PAYONE Commerce Platform Client JavaScript SDK, ensuring that the new release is published from the `master` branch while maintaining consistency and reliability.

**[back to top](#table-of-contents)**

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
