export interface ApplePayButtonConfig {
  buttonstyle: 'black' | 'white' | 'white-outline';
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
  locale: string;
  style?: {
    width?: string;
    height?: string;
    borderRadius?: string;
    padding?: string;
    boxSizing?: string;
  };
}

export interface ApplePayButton {
  selector: string;
  config: ApplePayButtonConfig;
}

export interface PCPApplePaySessionConfig
  extends ApplePayJS.ApplePayPaymentRequest {
  applePayVersion: number; // see: https://developer.apple.com/documentation/apple_pay_on_the_web/apple_pay_on_the_web_version_history
  validateMerchantURL: string;
  processPaymentURL: string;
  paymentMethodSelectedCallback?: (
    paymentMethod: ApplePayJS.ApplePayPaymentMethod,
  ) => Promise<ApplePayJS.ApplePayPaymentMethodUpdate>;
  couponCodeChangedCallback?: (
    couponCode: string,
  ) => Promise<ApplePayJS.ApplePayCouponCodeUpdate>;
  shippingMethodSelectedCallback?: (
    shippingMethod: ApplePayJS.ApplePayShippingMethod,
  ) => Promise<ApplePayJS.ApplePayShippingMethodUpdate>;
  shippingContactAddressSelectedCallback?: (
    shippingContact: ApplePayJS.ApplePayPaymentContact,
  ) => Promise<ApplePayJS.ApplePayShippingContactUpdate>;
  cancelCallback?: () => void;
  // any additional data required for your merchant validation
  merchantValidationData: Record<string, string>;
  errorCallback?: (type: ErrorType, error: Error) => void;
}

export enum ErrorType {
  VALIDATE_MERCHANT = 'VALIDATE_MERCHANT',
  PROCESS_PAYMENT = 'PROCESS_PAYMENT',
  ON_PAYMENT_METHOD_SELECTED = 'ON_PAYMENT_METHOD_SELECTED',
  ON_COUPON_CODE_CHANGED = 'ON_COUPON_CODE_CHANGED',
  ON_SHIPPING_METHOD_SELECTED = 'ON_SHIPPING_METHOD_SELECTED',
  ON_SHIPPING_CONTACT_SELECTED = 'ON_SHIPPING_CONTACT_SELECTED',
}
