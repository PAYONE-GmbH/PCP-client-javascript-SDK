import {
  PCPApplePaySession,
  type ApplePayButton,
  type ExpressPaymentResult,
  type PCPApplePaySessionConfig,
} from 'pcp-client-javascript-sdk';
import { money, quote, shippingOptions } from './backend';

/** Shared client-only options. Submission and UI remain the host application's responsibility. */
export interface AppleCheckoutOptions {
  validateMerchantURL: string;
  button: ApplePayButton;
  label?: string;
  applePayVersion?: number;
  supportedNetworks?: string[];
  submit: (
    payment: ApplePayJS.ApplePayPayment,
    shippingMethodId: string,
  ) => Promise<ExpressPaymentResult>;
  onResult: NonNullable<PCPApplePaySessionConfig['resultCallback']>;
  onCancel: () => void;
  onError: NonNullable<PCPApplePaySessionConfig['errorCallback']>;
}

function summary(label: string, optionId: string) {
  const price = quote('DE', optionId);
  return {
    total: { label, amount: money(price.total), type: 'final' as const },
    lineItems: [
      { label: 'Demo item (tax included)', amount: money(price.subtotal) },
      { label: 'Shipping', amount: money(price.shipping) },
    ],
  };
}

function baseRequest(options: AppleCheckoutOptions, optionId: string): PCPApplePaySessionConfig {
  return {
    applePayVersion: options.applePayVersion ?? 4,
    countryCode: 'DE',
    currencyCode: 'EUR',
    merchantCapabilities: ['supports3DS'],
    supportedNetworks: options.supportedNetworks ?? ['visa', 'masterCard', 'girocard'],
    ...summary(options.label ?? 'PAYONE demo', optionId),
    validateMerchantURL: options.validateMerchantURL,
    processPaymentCallback: (payment) => options.submit(payment, optionId),
    resultCallback: options.onResult,
    cancelCallback: options.onCancel,
    errorCallback: options.onError,
  };
}

/** Standard: merchant checkout supplies the address and shipping choice before opening Apple Pay. */
export function createStandardCheckout(
  options: AppleCheckoutOptions,
  contact: ApplePayJS.ApplePayPaymentContact,
  shippingMethodId: string,
): Promise<PCPApplePaySession> {
  quote(contact.countryCode, shippingMethodId);
  const address = structuredClone(contact);
  const request = baseRequest(options, shippingMethodId);
  // No wallet address/shipping selection: the merchant checkout is authoritative here.
  request.processPaymentCallback = (payment) =>
    options.submit(
      { ...payment, billingContact: address, shippingContact: address },
      shippingMethodId,
    );
  return PCPApplePaySession.create(request, options.button);
}

/** Express: Apple Pay collects final contacts and dynamically updates the shipping selection. */
export function createExpressCheckout(options: AppleCheckoutOptions): Promise<PCPApplePaySession> {
  let optionId = 'standard';
  const label = options.label ?? 'PAYONE demo';
  const methods = shippingOptions.map((option) => ({
    identifier: option.id,
    label: option.label,
    detail: 'Delivery in Germany',
    amount: money(option.cents),
  }));
  const update = () => {
    const { total, lineItems } = summary(label, optionId);
    return { newTotal: total, newLineItems: lineItems, newShippingMethods: methods };
  };
  return PCPApplePaySession.create(
    {
      ...baseRequest(options, optionId),
      requiredShippingContactFields: ['postalAddress', 'name', 'email', 'phone'],
      requiredBillingContactFields: ['postalAddress', 'name'],
      shippingMethods: methods,
      shippingContactAddressSelectedCallback: async (contact) => {
        if (contact.countryCode && contact.countryCode.toUpperCase() !== 'DE')
          return {
            ...update(),
            newShippingMethods: [],
            errors: [
              new ApplePayError(
                'shippingContactInvalid',
                'countryCode',
                'Delivery is only available in Germany.',
              ),
            ],
          };
        return update();
      },
      shippingMethodSelectedCallback: async (method) => {
        quote('DE', method.identifier);
        optionId = method.identifier;
        return update();
      },
      processPaymentCallback: (payment) => options.submit(payment, optionId),
      cancelCallback: () => {
        optionId = 'standard';
        options.onCancel();
      },
      errorCallback: (phase, error) => {
        optionId = 'standard';
        options.onError(phase, error);
      },
    },
    options.button,
  );
}
