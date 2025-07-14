export interface SubmitButtonConfig {
  selector?: string;
  element?: HTMLElement;
}

export interface UIConfig {
  formBgColor?: string;
  fieldBgColor?: string;
  fieldBorder?: string;
  fieldOutline?: string;
  fieldLabelColor?: string;
  fieldPlaceholderColor?: string;
  fieldTextColor?: string;
  fieldErrorCodeColor?: string;
  // Add more UI customization options as needed
}

export interface IframeConfig {
  iframeWrapperId: string;
  height?: number;
  width?: number;
}

export interface Config {
  /**
   * Configuration for the iframe container and its size.
   */
  iframe?: IframeConfig;

  /**
   * UI customization for the hosted tokenization form.
   */
  uiConfig?: UIConfig;

  /**
   * Locale for the form, e.g. "de_DE".
   */
  locale?: string;

  /**
   * Submit button configuration (selector or element).
   */
  submitButton?: SubmitButtonConfig;

  /**
   * Callback for successful tokenization.
   */
  tokenizationSuccessCallback: (
    statusCode: number,
    token: string,
    cardDetails: {
      cardholderName?: string;
      cardNumber?: string;
      expiryDate?: string;
      [key: string]: unknown;
    },
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
