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

export interface FieldErrors {
  isRequired?: string;
  isInvalid?: string;
  isTooShort?: string;
  notSupported?: string;
}

export interface LocaleTextLabels {
  cardNumber?: string;
  cardholderName?: string;
}

export interface LocaleTextPlaceholders {
  cardNumber?: string;
  cardholderName?: string;
}

export interface LocaleTextAriaLabels {
  cardNumber?: string;
  cardholderName?: string;
}

export interface LocaleTextErrors {
  cardNumber?: FieldErrors;
  cardholderName?: Omit<FieldErrors, 'isTooShort' | 'notSupported'>;
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
    inputMode: string,
  ) => void;

  /**
   * Callback for failed tokenization.
   */
  tokenizationFailureCallback: (
    statusCode: number,
    errorResponse: { error?: string; [key: string]: unknown },
  ) => void;

  /**
   * Environment for SDK loading: 'test' or 'live'.
   */
  environment: 'test' | 'live';
}
