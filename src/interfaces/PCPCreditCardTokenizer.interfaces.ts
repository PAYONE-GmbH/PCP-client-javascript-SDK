export interface SubmitButtonConfig {
  selector?: string;
  element?: HTMLElement;
}

export interface UIConfig {
  formBgColor?: string;
  formMarginLeft?: string;
  formMarginRight?: string;
  fieldBgColor?: string;
  fieldBorder?: string;
  fieldOutline?: string;
  fieldLabelColor?: string;
  fieldPlaceholderColor?: string;
  fieldTextColor?: string;
  fieldErrorCodeColor?: string;
  fontFamily?: string;
  fontUrl?: string;
  labelStyle?: FontStyle;
  inputStyle?: FontStyle;
  errorValidationStyle?: FontStyle;
  manualEntryFormLabelStyle?: FontStyle;
  checkboxLabelStyle?: FontStyle;
  termsTextStyle?: FontStyle;
  checkboxLabelColor?: string;
  checkboxSize?: string;
  btnBgColor?: string;
  btnTextColor?: string;
  btnBorderColor?: string;
  separatorColor?: string;
  separatorTextColor?: string;
  termsTextColor?: string;
  inputBorderRadius?: string;
  inputBorderColorDefault?: string;
  inputBorderColorSuccess?: string;
  inputBorderColorError?: string;
  inputFocusOutline?: string;
  inputPadding?: string;
  fieldSpacingVertical?: string;
  labelMarginBottom?: string;
  inputMarginBottom?: string;
  errorMarginBottom?: string;
  buttonMarginBottom?: string;
  separatorTextMarginBottom?: string;
  checkboxTextMarginBottom?: string;
  termsTextMarginBottom?: string;
  iconWidth?: string;
  iconPaddingRight?: string;
}

export interface FontStyle {
  fontSize?: string;
  fontWeight?: string;
  fontSizeMobile?: string;
}

export interface IframeConfig {
  iframeWrapperId: string;
  height?: number;
  width?: number;
  zIndex?: number;
}

/**
 * Configuration for custom validation icons (introduced in v1.4).
 */
export interface CustomIconsConfig {
  /** Enable or disable custom validation icons. */
  useCustomValidationIcons: boolean;
  /**
   * If true and useCustomValidationIcons is also true, the card number field
   * will show the detected card brand icon instead of the validation icon.
   */
  showCardBrandIcons?: boolean;
  /** Path to the success (valid) icon. Supported formats: svg, png, jpeg, jpg, webp. */
  successIcon?: string;
  /** Path to the error (invalid) icon. Supported formats: svg, png, jpeg, jpg, webp. */
  errorIcon?: string;
}

export interface VisaConfig {
  srcInitiatorId: string;
  srcDpaId: string;
  encryptionKey: string;
  nModulus: string;
}

export interface MastercardConfig {
  srcInitiatorId: string;
  srcDpaId: string;
}

export interface SchemeConfig {
  merchantPresentationName?: string;
  visaConfig?: VisaConfig;
  mastercardConfig?: MastercardConfig;
}

export interface TransactionAmount {
  amount: string;
  currencyCode: string;
}

/**
 * UI configuration consumed by the Click to Pay (CTP) component.
 */
export interface CTPUiConfig {
  buttonStyle?: string;
  buttonTextCase?: string;
  buttonAndBadgeColor?: string;
  buttonFilledHoverColor?: string;
  buttonOutlinedHoverColor?: string;
  buttonDisabledColor?: string;
  cardItemActiveColor?: string;
  buttonAndBadgeTextColor?: string;
  linkTextColor?: string;
  accentColor?: string;
  fontFamily?: string;
  buttonAndInputRadius?: string;
  cardItemRadius?: string;
}

/**
 * Click to Pay configuration (introduced in v1.3, extended in v1.4).
 */
export interface CTPConfig {
  /** Set to true to enable Click to Pay. */
  enableCTP: boolean;
  /** Set to true to enable customer onboarding on the scheme. */
  enableCustomerOnboarding: boolean;
  /** Configuration specific to each supported card scheme. */
  schemeConfig: SchemeConfig;
  /** Amount details to be paid by the end user. */
  transactionAmount: TransactionAmount;
  /** Optional UI customization for the CTP component. */
  uiConfig?: CTPUiConfig;
}

export interface LocaleTextLabels {
  cardNumber?: string;
  cardholderName?: string;
  expiryDate?: string;
  securityCode?: string;
  separatorText?: string;
  manualCardEntryBtnText?: string;
  formTitle?: string;
  email?: string;
  country?: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  selectedCountry?: string;
  addresslevel1?: string;
  stateProvince?: string;
  city?: string;
  zipCode?: string;
}

export interface LocaleTextPlaceholders {
  cardNumber?: string;
  cardholderName?: string;
  expiryDate?: string;
  securityCode?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  addressLevel1?: string;
  stateProvince?: string;
  city?: string;
  zipCode?: string;
}

export interface LocaleTextAriaLabels {
  cardNumber?: string;
  cardholderName?: string;
  expiryDate?: string;
  securityCode?: string;
  email?: string;
  country?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  addressLevel1?: string;
  city?: string;
  stateProvince?: string;
  zipCode?: string;
}

export interface LocaleTextErrors {
  cardNumber?: {
    isRequired?: string;
    isInvalid?: string;
    isTooShort?: string;
    notSupported?: string;
  };
  cardholderName?: {
    isRequired?: string;
    isInvalid?: string;
  };
  expiryDate?: {
    isRequired?: string;
    isInvalid?: string;
  };
  securityCode?: {
    isRequired?: string;
    amexCardSecurityCodeError?: string;
    generalSecurityCodeError?: string;
  };
  email?: {
    isRequired?: string;
    isInvalid?: string;
  };
  firstName?: {
    isRequired?: string;
  };
  lastName?: {
    isRequired?: string;
  };
  country?: {
    isRequired?: string;
  };
  mobileNumber?: {
    isRequired?: string;
    isInvalid?: string;
  };
  addressLevel1?: {
    isRequired?: string;
    isTooLong?: string;
  };
  city?: {
    isRequired?: string;
    isTooLong?: string;
    isTooShort?: string;
  };
  stateProvince?: {
    isRequired?: string;
    isTooLong?: string;
    isTooShort?: string;
  };
  zipCode?: {
    isRequired?: string;
    isInvalid?: string;
  };
}

export interface LocaleTextConfig {
  labels?: LocaleTextLabels;
  placeholders?: LocaleTextPlaceholders;
  arialabels?: LocaleTextAriaLabels;
  errors?: LocaleTextErrors;
}

export interface CustomTextConfig {
  en?: LocaleTextConfig;
  de?: LocaleTextConfig;
  [locale: string]: LocaleTextConfig | undefined;
}

export type CardScheme =
  | 'amex'
  | 'diners'
  | 'discover'
  | 'jcb'
  | 'maestro'
  | 'mastercard'
  | 'visa'
  | 'unionpay';

export interface Config {
  iframe: {
    iframeWrapperId: string;
    height?: number | 'auto';
    width?: number;
    zIndex?: number;
  };
  uiConfig?: UIConfig;
  locale?: string;
  token: string;
  /** Optional email address, used by Click to Pay to look up saved cards. */
  email?: string;
  /** Whether to show the cardholder name field (introduced in v1.4). */
  showCardholderName?: boolean;
  mode?: 'test' | 'live';
  allowedCardSchemes?: CardScheme[];
  customTextConfig?: CustomTextConfig;
  /** Custom validation icon configuration (introduced in v1.4). */
  customIconsConfig?: CustomIconsConfig;
  /** Click to Pay configuration (introduced in v1.3). */
  CTPConfig?: CTPConfig;
  /**
   * Submit button configuration (selector or element).
   */
  submitButton: SubmitButtonConfig;

  /**
   * Callback for successful tokenization.
   */
  tokenizationSuccessCallback: (
    statusCode: number,
    token: string,
    cardDetails: {
      cardholderName: string;
      cardNumber: string;
      expiryDate: string;
      cardType: string;
    },
    inputMode: string,
  ) => void;

  /**
   * Callback for failed tokenization.
   */
  tokenizationFailureCallback: (
    statusCode: number,
    errorResponse: { error?: string; [key: string]: unknown },
  ) => void;
}
