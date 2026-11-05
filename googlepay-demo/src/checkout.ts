import { PCPGooglePayExpress, type ExpressPaymentResult } from 'pcp-client-javascript-sdk';
import type { GoogleConfig } from './config';
import { money, quote, shippingOptions } from './pricing';

export interface CheckoutHandle {
  destroy(): void;
}

export interface GoogleCheckoutOptions extends GoogleConfig {
  selector: string;
  buttonColor?: google.payments.api.ButtonColor;
  buttonType?: google.payments.api.ButtonType;
  submit: (
    payment: google.payments.api.PaymentData,
    optionId: string,
  ) => Promise<ExpressPaymentResult>;
  onResult: (result: ExpressPaymentResult) => void;
  onCancel: () => void;
  onError: (error: unknown) => void;
}

/** API version, PAYONE gateway and networks are identical in both checkout flows. */
function baseRequest(options: GoogleCheckoutOptions): google.payments.api.PaymentDataRequest {
  return {
    apiVersion: 2,
    apiVersionMinor: 0,
    // Google permits omitting merchantId in TEST; @types/googlepay still marks it required.
    merchantInfo: {
      merchantName: options.merchantName,
      ...(options.merchantId ? { merchantId: options.merchantId } : {}),
    } as google.payments.api.MerchantInfo,
    allowedPaymentMethods: [
      {
        type: 'CARD',
        parameters: {
          allowedAuthMethods: [...(options.allowedAuthMethods ?? ['CRYPTOGRAM_3DS'])],
          allowedCardNetworks: ['VISA', 'MASTERCARD'],
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: { gateway: 'payonegmbh', gatewayMerchantId: options.gatewayMerchantId },
        },
      },
    ],
    transactionInfo: transactionInfo('standard', 'FINAL'),
    callbackIntents: ['PAYMENT_AUTHORIZATION'],
  };
}

function transactionInfo(
  optionId: string,
  status: 'ESTIMATED' | 'FINAL',
): google.payments.api.TransactionInfo {
  const price = quote('DE', optionId);
  return {
    countryCode: 'DE',
    currencyCode: 'EUR',
    totalPriceStatus: status,
    totalPrice: money(price.total),
    totalPriceLabel: 'Total',
    displayItems: [
      { label: 'Demo item (tax included)', type: 'SUBTOTAL', price: money(price.subtotal) },
      { label: 'Shipping (tax included)', type: 'LINE_ITEM', price: money(price.shipping) },
    ],
  };
}

/** Standard uses the merchant's immutable contact; Google collects payment details only. */
export async function createStandardCheckout(
  options: GoogleCheckoutOptions,
  contact: google.payments.api.Address,
  email: string,
  optionId: string,
): Promise<CheckoutHandle> {
  quote(contact.countryCode, optionId);
  const address = structuredClone(contact);
  const container = document.querySelector(options.selector);
  if (!container) throw new Error(`Button selector ${options.selector} does not exist.`);
  const { default: GooglePayButton } = await import('@google-pay/button-element');
  const button = new GooglePayButton();
  let destroyed = false;
  let authorization: Promise<google.payments.api.PaymentAuthorizationResult> | undefined;
  let outcome: ExpressPaymentResult | undefined;
  let walletErrorReported = false;
  button.environment = options.environment;
  button.buttonLocale = options.buttonLocale;
  button.buttonColor = options.buttonColor ?? 'black';
  button.buttonType = options.buttonType ?? 'pay';
  button.paymentRequest = {
    ...baseRequest(options),
    transactionInfo: transactionInfo(optionId, 'FINAL'),
  };
  button.onPaymentAuthorized = (payment) => {
    authorization ??= (async (): Promise<google.payments.api.PaymentAuthorizationResult> => {
      try {
        if (destroyed) throw new Error('Checkout was destroyed.');
        const cardInfo = payment.paymentMethodData.info;
        if (!cardInfo) throw new Error('Missing Google Pay card information.');
        outcome = await options.submit(
          {
            ...payment,
            email,
            shippingAddress: structuredClone(address),
            paymentMethodData: {
              ...payment.paymentMethodData,
              info: { ...cardInfo, billingAddress: structuredClone(address) },
            },
          },
          optionId,
        );
        if (outcome.status !== 'failed') return { transactionState: 'SUCCESS' };
        return {
          transactionState: 'ERROR',
          error: {
            intent: 'PAYMENT_AUTHORIZATION',
            reason: 'OTHER_ERROR',
            message: outcome.message,
          },
        };
      } catch (error) {
        if (!destroyed) options.onError(error);
        return {
          transactionState: 'ERROR',
          error: {
            intent: 'PAYMENT_AUTHORIZATION',
            reason: 'OTHER_ERROR',
            message: 'Payment could not be processed. Check payment status before retrying.',
          },
        };
      }
    })();
    return authorization;
  };
  // Google SUCCESS closes the sheet; the actual backend result can still require 3DS or be pending.
  button.onLoadPaymentData = () => {
    if (!destroyed && outcome) options.onResult(outcome);
  };
  button.onCancel = () => {
    if (!destroyed) options.onCancel();
  };
  button.onError = (error) => {
    walletErrorReported = true;
    if (!destroyed) options.onError(error);
  };
  button.onReadyToPayChange = (ready) => {
    // button-element emits false readiness after a rejected isReadyToPay call too.
    // Preserve that call's specific error instead of overwriting it with a generic message.
    if (!destroyed && !walletErrorReported && !ready.isReadyToPay)
      options.onError(new Error('Google Pay is not available.'));
  };
  container.appendChild(button);
  return {
    destroy: () => {
      destroyed = true;
      button.remove();
    },
  };
}

/** Express obtains final contacts from Google; intermediate callbacks only update prices. */
export function createExpressCheckout(options: GoogleCheckoutOptions): Promise<CheckoutHandle> {
  let optionId = 'standard';
  const shipping = (): google.payments.api.ShippingOptionParameters => ({
    defaultSelectedOptionId: optionId,
    shippingOptions: shippingOptions.map((option) => ({
      id: option.id,
      label: `${option.label} €${money(option.cents)}`,
      description: 'Delivery in Germany',
    })),
  });
  const request = baseRequest(options);
  const parameters = request.allowedPaymentMethods[0].parameters!;
  parameters.billingAddressRequired = true;
  parameters.billingAddressParameters = { format: 'FULL', phoneNumberRequired: true };
  return PCPGooglePayExpress.create(
    {
      environment: options.environment,
      paymentRequest: {
        ...request,
        emailRequired: true,
        shippingAddressRequired: true,
        shippingOptionRequired: true,
        shippingAddressParameters: { allowedCountryCodes: ['DE'], phoneNumberRequired: true },
        shippingOptionParameters: shipping(),
        transactionInfo: transactionInfo(optionId, 'ESTIMATED'),
        callbackIntents: ['PAYMENT_AUTHORIZATION', 'SHIPPING_ADDRESS', 'SHIPPING_OPTION'],
      },
      buttonOptions: {
        buttonLocale: options.buttonLocale,
        buttonColor: options.buttonColor ?? 'black',
        buttonType: options.buttonType ?? 'buy',
      },
      paymentDataChangedCallback: async (data) => {
        // INITIALIZE may carry Google's synthetic "shipping_option_unselected" ID.
        const selected = data.shippingOptionData?.id;
        if (selected && selected !== 'shipping_option_unselected') {
          quote('DE', selected);
          optionId = selected;
        }
        const update = {
          newTransactionInfo: transactionInfo(optionId, 'FINAL'),
          newShippingOptionParameters: shipping(),
        };
        if (data.shippingAddress?.countryCode && data.shippingAddress.countryCode !== 'DE') {
          return {
            ...update,
            error: {
              intent: 'SHIPPING_ADDRESS',
              reason: 'SHIPPING_ADDRESS_UNSERVICEABLE',
              message: 'Delivery is only available in Germany.',
            },
          };
        }
        return update;
      },
      processPaymentCallback: (payment) => {
        if (!payment.shippingAddress) throw new Error('Missing final shipping address.');
        const selected = payment.shippingOptionData?.id;
        if (!selected || selected !== optionId)
          throw new Error('Final shipping option does not match the displayed quote.');
        quote(payment.shippingAddress.countryCode, selected);
        return options.submit(payment, selected);
      },
      resultCallback: options.onResult,
      cancelCallback: () => {
        optionId = 'standard';
        options.onCancel();
      },
      errorCallback: options.onError,
    },
    { selector: options.selector },
  );
}
