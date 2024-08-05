export interface ApplePayButtonConfig {
  /**
   * The appearance of the Apple Pay button, such as a black button with white lettering.
   * For a list of button styles, see https://developer.apple.com/documentation/apple_pay_on_the_web/applepaybuttonstyle
   */
  buttonstyle: 'black' | 'white' | 'white-outline';
  /**
   * The kind of Apple Pay button, such as a button for purchasing a subscription.
   * For a list of button types, see https://developer.apple.com/documentation/apple_pay_on_the_web/applepaybuttontype
   */
  type:
    | 'add-money'
    | 'book'
    | 'buy'
    | 'check-out'
    | 'continue'
    | 'contribute'
    | 'donate'
    | 'order'
    | 'pay'
    | 'plain'
    | 'reload'
    | 'rent'
    | 'set-up'
    | 'subscribe'
    | 'support'
    | 'tip'
    | 'top-up';
  /**
   * The language and region used for the displayed Apple Pay button.
   * For a list of button locales, see https://developer.apple.com/documentation/apple_pay_on_the_web/applepaybuttonlocale
   */
  locale: string;
  /**
   * Additional CSS styles to apply to the Apple Pay button.
   */
  style?: {
    width?: string;
    height?: string;
    borderRadius?: string;
    padding?: string;
    boxSizing?: string;
  };
}

export interface ApplePayButton {
  /**
   * The selector for the container element in which to display the Apple Pay button.
   */
  selector: string;
  config: ApplePayButtonConfig;
}

export interface PCPApplePaySessionConfig
  extends ApplePayJS.ApplePayPaymentRequest {
  /**
   * The version of Apple Pay on the Web that your website supports.
   * see: https://developer.apple.com/documentation/apple_pay_on_the_web/apple_pay_on_the_web_version_history
   */
  applePayVersion: number;
  /**
   * The URL your server must use to validate itself and obtain a merchant session object.
   */
  validateMerchantURL: string;
  /**
   * The URL your server must use to process the payment.
   */
  processPaymentURL: string;
  /**
   * Callback function that is called when the user selects a new payment method
   * @param {ApplePayJS.ApplePayPaymentMethod} paymentMethod
   * @returns {Promise<ApplePayJS.ApplePayPaymentMethodUpdate>}
   */
  paymentMethodSelectedCallback?: (
    paymentMethod: ApplePayJS.ApplePayPaymentMethod,
  ) => Promise<ApplePayJS.ApplePayPaymentMethodUpdate>;
  /**
   * Callback function that is called when the user enters or updates a coupon code.
   * @param {string} couponCode
   * @returns {Promise<ApplePayJS.ApplePayCouponCodeUpdate>}
   */
  couponCodeChangedCallback?: (
    couponCode: string,
  ) => Promise<ApplePayJS.ApplePayCouponCodeUpdate>;
  /**
   * Callback function that is called when the user selects a shipping method.
   * @param {ApplePayJS.ApplePayShippingMethod} shippingMethod
   * @returns {Promise<ApplePayJS.ApplePayShippingMethodUpdate>}
   */
  shippingMethodSelectedCallback?: (
    shippingMethod: ApplePayJS.ApplePayShippingMethod,
  ) => Promise<ApplePayJS.ApplePayShippingMethodUpdate>;
  /**
   * Callback function that is called when the user selects a shipping contact in the payment sheet.
   * @param {ApplePayJS.ApplePayPaymentContact} shippingContact
   * @returns {Promise<ApplePayJS.ApplePayShippingContactUpdate>}
   */
  shippingContactAddressSelectedCallback?: (
    shippingContact: ApplePayJS.ApplePayPaymentContact,
  ) => Promise<ApplePayJS.ApplePayShippingContactUpdate>;
  /**
   * Callback function that is called when the payment UI is dismissed.
   */
  cancelCallback?: () => void;
  /**
   * Any additional data that you need to pass to the server for your validation.
   */
  merchantValidationData: Record<string, string>;
  /**
   * Error callback function that is called when an error occurs.
   * @param {ErrorType} type
   * @param {Error} error
   */
  errorCallback?: (type: ErrorType, error: Error) => void;
}

/**
 * Error types that can occur during the Apple Pay session.
 * These errors are passed to the errorCallback function in the PCPApplePaySessionConfig.
 */
export enum ErrorType {
  VALIDATE_MERCHANT = 'VALIDATE_MERCHANT',
  PROCESS_PAYMENT = 'PROCESS_PAYMENT',
  ON_PAYMENT_METHOD_SELECTED = 'ON_PAYMENT_METHOD_SELECTED',
  ON_COUPON_CODE_CHANGED = 'ON_COUPON_CODE_CHANGED',
  ON_SHIPPING_METHOD_SELECTED = 'ON_SHIPPING_METHOD_SELECTED',
  ON_SHIPPING_CONTACT_SELECTED = 'ON_SHIPPING_CONTACT_SELECTED',
}
