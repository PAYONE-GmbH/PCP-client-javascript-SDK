import {
  type Config,
  type CTPConfig,
  type CustomIconsConfig,
  type CustomTextConfig,
  PCPCreditCardTokenizer,
  type UIConfig,
} from 'pcp-client-javascript-sdk';

// ---------------------------------------------------------------------------
// UI Configuration
// ---------------------------------------------------------------------------
const uiConfig: UIConfig = {
  formBgColor: '#ffffff',
  fieldBgColor: '#ffffff',
  fieldBorder: '1px solid #8f8f8f',
  fieldOutline: '#da0c1f solid 1px',
  fieldLabelColor: '#333333',
  fieldPlaceholderColor: '#333333',
  fieldTextColor: '#333333',
  fieldErrorCodeColor: '#8f8f8f',
  fontFamily: 'Mozilla Headline',
  fontUrl:
    'https://fonts.googleapis.com/css2?family=Mozilla+Headline:wght@200..700&family=Nata+Sans:wght@100..900&display=swap',
  labelStyle: {
    fontSize: '20px',
    fontWeight: '900',
    fontSizeMobile: '16px',
  },
  inputStyle: {
    fontSize: '20px',
    fontWeight: '900',
    fontSizeMobile: '16px',
  },
  errorValidationStyle: {
    fontSize: '16px',
    fontWeight: 'normal',
    fontSizeMobile: '14px',
  },
  btnBgColor: '#0096d6',
  btnTextColor: '#ffffff',
  btnBorderColor: '#0096d6',
  separatorColor: '#8FA8C8',
  separatorTextColor: '#64748B',
  inputBorderRadius: '8px',
  inputBorderColorDefault: '#8f8f8f',
  inputBorderColorSuccess: '#22C55E',
  inputBorderColorError: '#da0c1f',
};

// ---------------------------------------------------------------------------
// Custom validation icons (v1.4)
// ---------------------------------------------------------------------------
const customIconsConfig: CustomIconsConfig = {
  useCustomValidationIcons: false,
  showCardBrandIcons: true,
  successIcon: '/icons/valid.svg',
  errorIcon: '/icons/invalid.svg',
};

// ---------------------------------------------------------------------------
// Custom text configuration (v1.3+)
// ---------------------------------------------------------------------------
const customTextConfig: CustomTextConfig = {
  en: {
    labels: {
      cardNumber: 'Card Number',
      cardholderName: 'Cardholder Name',
      expiryDate: 'Expiry Date',
      securityCode: 'Security Code',
    },
    placeholders: {
      cardNumber: '1234 5678 9012 3456',
      cardholderName: 'John Doe',
      expiryDate: 'MM/YY',
      securityCode: 'CVV',
    },
    arialabels: {
      cardNumber: 'Enter your card number',
      cardholderName: 'Enter the name on the card',
      expiryDate: 'Enter the expiration month and year',
      securityCode: 'Enter the card verification code',
    },
    errors: {
      cardNumber: {
        isRequired: 'Card number is required',
        isInvalid: 'Invalid card number',
        isTooShort: 'Card number is too short',
        notSupported: 'Card type not supported',
      },
      cardholderName: {
        isRequired: 'Cardholder name is required',
        isInvalid: 'Invalid cardholder name',
      },
      expiryDate: {
        isRequired: 'Expiry date is required',
        isInvalid: 'Invalid expiry date',
      },
      securityCode: {
        isRequired: 'Security code is required',
        amexCardSecurityCodeError: 'Invalid Amex security code (4 digits)',
        generalSecurityCodeError: 'Invalid security code',
      },
    },
  },
  de: {
    labels: {
      cardNumber: 'Kartennummer',
      cardholderName: 'Name des Karteninhabers',
      expiryDate: 'Gültigkeitsdatum',
      securityCode: 'Sicherheitscode',
    },
    placeholders: {
      cardNumber: '1234 5678 9012 3456',
      cardholderName: 'Max Mustermann',
      expiryDate: 'MM/JJ',
      securityCode: 'CVV',
    },
    arialabels: {
      cardNumber: 'Kartennummer eingeben',
      cardholderName: 'Name auf der Karte eingeben',
      expiryDate: 'Ablaufmonat und -jahr der Karte eingeben',
      securityCode: 'Kartenprüfnummer eingeben',
    },
    errors: {
      cardNumber: {
        isRequired: 'Kartennummer ist erforderlich',
        isInvalid: 'Ungültige Kartennummer',
        isTooShort: 'Kartennummer ist zu kurz',
        notSupported: 'Kartentyp wird nicht unterstützt',
      },
      cardholderName: {
        isRequired: 'Name des Karteninhabers ist erforderlich',
        isInvalid: 'Ungültiger Name des Karteninhabers',
      },
      expiryDate: {
        isRequired: 'Gültigkeitsdatum ist erforderlich',
        isInvalid: 'Ungültiges Gültigkeitsdatum',
      },
      securityCode: {
        isRequired: 'Sicherheitscode ist erforderlich',
        amexCardSecurityCodeError: 'Ungültiger Amex-Sicherheitscode (4 Ziffern)',
        generalSecurityCodeError: 'Ungültiger Sicherheitscode',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Click to Pay configuration (v1.3+) — set enableCTP: true to activate
// ---------------------------------------------------------------------------
const ctpConfig: CTPConfig = {
  enableCTP: false,
  enableCustomerOnboarding: true,
  schemeConfig: {
    merchantPresentationName: 'My Demo Shop',
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
    amount: '1999',
    currencyCode: 'EUR',
  },
  uiConfig: {
    buttonStyle: 'solid',
    buttonTextCase: 'capitalize',
    buttonAndBadgeColor: '#0096d6',
    buttonFilledHoverColor: '#007ab8',
    buttonAndBadgeTextColor: '#ffffff',
    fontFamily: 'Mozilla Headline',
    buttonAndInputRadius: '8px',
    cardItemRadius: '8px',
  },
};

// ---------------------------------------------------------------------------
// JWT fetch — replace with your actual backend call
// ---------------------------------------------------------------------------
const fetchJwt = async (): Promise<string> => {
  // Start one of the Server SDKs or call /v1/{merchantId}/authentication-token
  // directly to obtain a JWT, then return it here.
  return '<Token to be retrieved from the CommercePlatform-API>';
};

// ---------------------------------------------------------------------------
// Helpers to display results in the UI
// ---------------------------------------------------------------------------
function showResult(html: string) {
  const el = document.getElementById('result');
  if (el) el.innerHTML = html;
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------
const init = async () => {
  const token = await fetchJwt();

  const config: Config = {
    iframe: {
      iframeWrapperId: 'payment-IFrame',
      height: 'auto',
      width: 400,
      zIndex: 9998,
    },
    uiConfig,
    locale: 'de_DE',
    token,
    mode: 'test',

    // v1.4: show the cardholder name field
    showCardholderName: true,

    // v1.4: pre-fill email (used by Click to Pay for card lookup)
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

    // v1.4: custom validation icons
    customIconsConfig,

    // v1.3+: custom text per locale
    customTextConfig,

    // v1.3+: Click to Pay — set enableCTP: true in ctpConfig above to activate
    CTPConfig: ctpConfig,

    submitButton: {
      selector: '#submit',
    },

    tokenizationSuccessCallback: (statusCode, tokenValue, cardDetails, inputMode) => {
      console.log('Tokenization succeeded');
      console.log('Status:', statusCode);
      console.log('Token:', tokenValue);
      console.log('Card Details:', cardDetails);
      console.log('Input Mode:', inputMode);
      showResult(`
        <strong>Success (${statusCode})</strong><br>
        Token: <code>${tokenValue}</code><br>
        Cardholder: ${cardDetails.cardholderName}<br>
        Card: ${cardDetails.cardNumber}<br>
        Expiry: ${cardDetails.expiryDate}<br>
        Type: ${cardDetails.cardType}<br>
        Input Mode: ${inputMode}
      `);
    },

    tokenizationFailureCallback: (statusCode, errorResponse) => {
      console.error('Tokenization failed');
      console.error('Status:', statusCode);
      console.error('Error:', errorResponse.error);
      showResult(`
        <strong>Failure (${statusCode})</strong><br>
        Error: ${errorResponse.error ?? JSON.stringify(errorResponse)}
      `);
    },
  };

  await PCPCreditCardTokenizer.create(config);
};

init();
