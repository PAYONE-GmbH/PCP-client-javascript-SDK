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

export interface LocaleTextLabels {
  cardNumber?: string;
  cardholderName?: string;
  expiryDate?: string;
  securityCode?: string;
}

export interface LocaleTextPlaceholders {
  cardNumber?: string;
  cardholderName?: string;
  expiryDate?: string;
  securityCode?: string;
}

export interface LocaleTextAriaLabels {
  cardNumber?: string;
  cardholderName?: string;
  expiryDate?: string;
  securityCode?: string;
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
  mode?: 'test' | 'live';
  allowedCardSchemes?: CardScheme[];
  customTextConfig?: CustomTextConfig;
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
    inputMode: string
  ) => void;

  /**
   * Callback for failed tokenization.
   */
  tokenizationFailureCallback: (
    statusCode: number,
    errorResponse: { error?: string; [key: string]: unknown }
  ) => void;
}
