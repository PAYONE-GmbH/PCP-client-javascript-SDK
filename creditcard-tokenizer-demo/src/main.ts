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
  // Omit schemeConfig entirely: SDK 1.6.0 retrieves it from PAYONE when CTP is enabled.
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
// Supply a short-lived JWT issued by your backend, never a merchant API secret.
// ---------------------------------------------------------------------------
const setup = document.querySelector<HTMLFormElement>('#setup')!;
const submit = document.querySelector<HTMLInputElement>('#submit')!;
const initialize = document.querySelector<HTMLButtonElement>('#initialize')!;
let tokenizer: PCPCreditCardTokenizer | undefined;

// ---------------------------------------------------------------------------
// Helpers to display results in the UI
// ---------------------------------------------------------------------------
function showResult(text: string) {
  const el = document.getElementById('result');
  if (el) el.textContent = text;
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------
const init = async (token: string, mode: 'test' | 'live') => {
  let renderFailed = false;
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
    mode,
    isSecurityCodeMasked: true,
    paymentPageCallback: (status, response) => {
      if (typeof status === 'number' && (status === 0 || status >= 400)) {
        renderFailed = true;
        submit.disabled = true;
        showResult(`Card form failed (${status}): ${JSON.stringify(response)}`);
      }
    },

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
      showResult(
        JSON.stringify({ statusCode, token: tokenValue, cardDetails, inputMode }, null, 2),
      );
    },

    tokenizationFailureCallback: (statusCode, errorResponse) => {
      showResult(
        `Tokenization failed (${statusCode}): ${errorResponse.error ?? JSON.stringify(errorResponse)}`,
      );
    },
  };

  tokenizer = await PCPCreditCardTokenizer.create(config);
  return !renderFailed;
};

setup.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(setup);
  initialize.disabled = true;
  submit.disabled = true;
  tokenizer?.destroy();
  document.getElementById('payment-IFrame')!.replaceChildren();
  showResult('Initializing hosted card form…');
  try {
    const initialized = await init(
      String(data.get('token')).trim(),
      data.get('mode') === 'live' ? 'live' : 'test',
    );
    if (initialized) {
      showResult('Card form initialized. Tokenization creates a token, not a payment.');
      submit.disabled = false;
    }
  } catch (error) {
    showResult(error instanceof Error ? error.message : 'Initialization failed.');
  } finally {
    initialize.disabled = false;
  }
});
window.addEventListener('pagehide', () => tokenizer?.destroy());
