# PayOne PCP JavaScript Client SDK

**NOTE:** This SDK is still under development. Some things may be broken, features may change in non-compatible ways or will be removed completely.

Welcome to the PayOne PCP JavaScript Client SDK for the PayOne PCP platform. This SDK provides everything a client needs to easily complete payments using Credit or Debit Card, PAYONE Buy Now Pay Later (BNPL) and Apple Pay.

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
  - [PCP Compliant Interfaces](#pcp-compliant-interfaces)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Credit Card Tokenizer**: Securely tokenize credit and debit card information.
- **Fingerprinting Tokenizer**: Generate unique tokens for device fingerprinting.
- **Apple Pay Session Integration**: Seamlessly integrate Apple Pay into your payment workflow.

## Installation

To install the PayOne PCP JavaScript Client SDK, you can use either `npm`, `yarn`, or `pnpm`. Choose the command that corresponds to your package manager:

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

## Usage

### Credit Card Tokenizer

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

The configuration object sets up styles, auto card type detection, credit card icons, and callbacks. Below are the details for each field in the configuration object:

#### Property: fields

Defines the various input fields for credit card details.

| Property          | Type                  | Description                                        |
| ----------------- | --------------------- | -------------------------------------------------- |
| `cardtype`        | `CardtypeFieldConfig` | Configuration for the card type field.             |
| `cardpan`         | `FieldConfig`         | Configuration for the card number field.           |
| `cardcvc2`        | `FieldConfig`         | Configuration for the card CVC2 field.             |
| `cardexpiremonth` | `FieldConfig`         | Configuration for the card expiration month field. |
| `cardexpireyear`  | `FieldConfig`         | Configuration for the card expiration year field.  |

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

The `Cardtype` values are used within the configuration object to specify the supported card types for various fields and functionalities, such as the automatic card type detection and the selection of credit card icons. These values help the SDK correctly identify and handle different types of credit cards based on the BIN range.

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
  // The hash is generated by the client SDK.
};
```

#### Request Object Properties

| Attribute       | Value                       | Description                                                                                         |
| --------------- | --------------------------- | --------------------------------------------------------------------------------------------------- |
| `request`       | `'creditcardcheck'`         | Fixed value indicating the type of request.                                                         |
| `responsetype`  | `'JSON'`                    | Fixed value indicating the response format.                                                         |
| `mode`          | `'live'` or `'test'`        | Mode for transactions.                                                                              |
| `mid`           | Your Merchant ID            | Unique identifier assigned to the merchant.                                                         |
| `aid`           | Your Account ID             | Unique identifier assigned to the account.                                                          |
| `portalid`      | Your Portal ID              | Unique identifier assigned to the portal.                                                           |
| `encoding`      | `'ISO-8859-1'` or `'UTF-8'` | Character encoding to be used.                                                                      |
| `storecarddata` | `'yes'`                     | Fixed value indicating whether to store card data.                                                  |
| `api_version`   | `'3.11'`                    | Fixed value indicating the API version.                                                             |
| `checktype`     | `'TC'` (optional)           | Configuration valid for Deutsche Bahn only. Indicates starting `creditcardcheck` with travel cards. |
| `hash`          | Generated hash value        | SHA-2 384 hash over request values plus the portal key in your PMI portal configuration.            |

#### Hash Generation

The `hash` attribute is a security feature that ensures the integrity and authenticity of the request. It is generated by creating an HMAC-SHA384 hash of the concatenated request values (in alphabetical order) and your portal key. The client SDK handles the hash generation, so no additional implementation is necessary on your part.

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

For further information see: https://docs.payone.com/integration/channel-client-api/client-api-hosted-iframe-mode

### Fingerprinting Tokenizer

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

#### 4. **Get Snippet Token:**

- Once the scripts are loaded, you can obtain the snippet token required for the PAYONE BNPL payment process by calling:
  ```typescript
  const token = fingerprintingTokenizer.getSnippetToken();
  ```
- This snippet token is automatically generated when the `PCPFingerprintingTokenizer` instance is created and is also stored by Payla for payment verification. You need to send this snippet token to your server so that it can be included in the payment request. Add the token to the property `paymentMethodSpecificInput.customerDevice.deviceToken`.

#### 5. **(Optional) Get Unique SessionID:**

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

- **Credit Card Tokenizer**: Check out the [creditcard-tokenizer-demo](./creditcard-tokenizer-demo/) folder.
- **Fingerprinting Tokenizer**: See the [fingerprinting-tokenizer-demo](./fingerprinting-tokenizer-demo/) folder.
- **Apple Pay Session Integration**: Refer to the [applepay-demo](./applepay-demo/) folder.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

This project is licensed under the MIT License. For more details, see the [LICENSE](./LICENSE) file.
