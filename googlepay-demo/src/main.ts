/** Standard example: merchant form → official Google button → Commerce order → result.
 * Adapt the public settings and sample cart; your server validates pricing and enforces idempotency.
 */
import GooglePayButton from '@google-pay/button-element';
import {
  OrderType,
  ProductType,
  type ExpressPaymentReference,
  type ExpressPaymentResult,
} from 'pcp-client-javascript-sdk';
import { CommerceApiService } from './api/commerce-api.service';
import { ConfigService } from './config';
import { googleInput, mapCreated, mapCheckout, show, showError, showResult } from './utils';
import './style.css';

function main() {
  const config = new ConfigService();
  const api = new CommerceApiService(config.backendUrl);
  const form = document.querySelector<HTMLFormElement>('#checkout')!;
  const fields = form.querySelector<HTMLFieldSetElement>('fieldset')!;
  const edit = document.querySelector<HTMLButtonElement>('#edit')!;
  const shipping = form.querySelector<HTMLSelectElement>('[name=shipping]')!;
  const key = `google:standard:${api.baseUrl}`;
  const returnUrl = `${location.origin}${location.pathname}?returned=1`;
  if (returnUrl.length > 200) {
    throw new Error('Serve the demo at a shorter URL (3DS return maximum: 200 characters).');
  }
  const params = new URL(location.href).searchParams;

  // Store IDs only. A marker without IDs means the POST outcome is uncertain.
  async function checkStatus() {
    const reference = JSON.parse(
      sessionStorage.getItem(key) ?? 'null',
    ) as ExpressPaymentReference | null;
    if (!reference?.commerceCaseId || !reference.checkoutId) {
      show('No checkout IDs. Reconcile an uncertain payment in your backend before retrying.');
      return;
    }
    showResult(
      mapCheckout(
        (await api.getCheckout(reference.commerceCaseId, reference.checkoutId)).body,
        reference,
      ),
    );
  }
  document.querySelector('#check-status')!.addEventListener('click', () => {
    void checkStatus().catch(showError);
  });
  if (sessionStorage.getItem(key) || params.has('returned')) {
    fields.disabled = true;
    void checkStatus().catch(showError);
    return;
  }

  let button: GooglePayButton | undefined;
  let disposed = false;
  window.addEventListener(
    'pagehide',
    () => {
      disposed = true;
      button?.remove();
    },
    { once: true },
  );
  const updateTotal = () => {
    document.querySelector('#total')!.textContent =
      shipping.value === 'express' ? '€29.80' : '€24.80';
  };
  shipping.addEventListener('change', updateTotal);
  updateTotal();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (fields.disabled || !form.reportValidity()) {
      return;
    }
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) ?? '').trim();
    const shippingPrice = value('shipping') === 'express' ? 990 : 490;
    const address = {
      countryCode: 'DE',
      city: value('city'),
      zip: value('postalCode'),
      street: value('street'),
    };
    const name = { firstName: value('givenName'), surname: value('familyName') };
    fields.disabled = true;
    button = new GooglePayButton();
    button.environment = config.environment;
    button.buttonLocale = config.buttonLocale;
    button.buttonType = 'pay';
    button.paymentRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      merchantInfo: {
        merchantName: config.merchantName,
        ...(config.merchantId ? { merchantId: config.merchantId } : {}),
      } as google.payments.api.MerchantInfo,
      allowedPaymentMethods: [
        {
          type: 'CARD',
          parameters: {
            allowedAuthMethods: config.authMethods,
            allowedCardNetworks: ['VISA', 'MASTERCARD'],
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: { gateway: 'payonegmbh', gatewayMerchantId: config.gatewayMerchantId },
          },
        },
      ],
      transactionInfo: {
        countryCode: 'DE',
        currencyCode: 'EUR',
        totalPriceStatus: 'FINAL',
        totalPrice: ((1990 + shippingPrice) / 100).toFixed(2),
        totalPriceLabel: 'Total',
        displayItems: [
          { label: 'Item (tax included)', type: 'SUBTOTAL', price: '19.90' },
          { label: 'Shipping', type: 'LINE_ITEM', price: (shippingPrice / 100).toFixed(2) },
        ],
      },
      callbackIntents: ['PAYMENT_AUTHORIZATION'],
    };
    let outcome: ExpressPaymentResult | undefined;
    let authorization: Promise<google.payments.api.PaymentAuthorizationResult> | undefined;
    async function authorize(
      payment: google.payments.api.PaymentData,
    ): Promise<google.payments.api.PaymentAuthorizationResult> {
      try {
        if (sessionStorage.getItem(key)) {
          throw new Error('Order already submitted. Check payment status.');
        }
        const input = googleInput(payment, returnUrl);
        const reference = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
        // The form snapshot supplies contacts; Google supplies only the token.
        const request = {
          customer: {
            billingAddress: address,
            personalInformation: { name },
            contactDetails: { emailAddress: value('email'), phoneNumber: value('phone') },
          },
          checkout: {
            amountOfMoney: { amount: 1990 + shippingPrice, currencyCode: 'EUR' },
            references: { merchantReference: reference },
            shipping: { address: { ...address, name } },
            shoppingCart: {
              items: [
                {
                  orderLineDetails: {
                    productCode: 'GOOGLE-DEMO',
                    productName: 'Demo item (tax included)',
                    productType: ProductType.GOODS,
                    productPrice: 1990,
                    quantity: 1,
                  },
                },
                {
                  orderLineDetails: {
                    productCode: value('shipping'),
                    productName: 'Shipping',
                    productType: ProductType.SHIPMENT,
                    productPrice: shippingPrice,
                    quantity: 1,
                  },
                },
              ],
            },
            autoExecuteOrder: true,
            orderRequest: {
              orderType: OrderType.FULL,
              orderReferences: { merchantReference: reference },
              paymentMethodSpecificInput: { mobilePaymentMethodSpecificInput: input },
            },
          },
        };
        sessionStorage.setItem(key, '{}');
        const response = await api.createCommerceCase(request);
        sessionStorage.setItem(
          key,
          JSON.stringify({
            commerceCaseId: response.body.commerceCaseId,
            checkoutId: response.body.checkout?.checkoutId,
          }),
        );
        outcome = mapCreated(response.body, response.status);
        if (outcome.status === 'failed') {
          throw new Error(outcome.message);
        }
        return { transactionState: 'SUCCESS' };
      } catch (error) {
        if (!disposed) {
          showError(error);
        }
        return {
          transactionState: 'ERROR',
          error: {
            intent: 'PAYMENT_AUTHORIZATION',
            reason: 'OTHER_ERROR',
            message: 'Payment could not be completed. Check payment status before retrying.',
          },
        };
      }
    }
    button.onPaymentAuthorized = (payment) => {
      authorization ??= authorize(payment);
      return authorization;
    };
    // SUCCESS closes Google's sheet; only the backend result establishes payment state.
    button.onLoadPaymentData = () => {
      if (!disposed && outcome) {
        showResult(outcome);
      }
    };
    button.onCancel = () => {
      if (!disposed) {
        show('Google Pay cancelled.');
      }
    };
    button.onError = (error) => {
      if (!disposed) {
        showError(error);
      }
    };
    document.querySelector('#wallet')!.appendChild(button);
    edit.hidden = false;
    show('Details confirmed. Choose Google Pay.');
  });
  edit.addEventListener('click', () => {
    if (sessionStorage.getItem(key)) {
      show('Order already submitted. Check payment status.');
      return;
    }
    button?.remove();
    fields.disabled = false;
    edit.hidden = true;
  });
  show('Enter contact details and choose shipping.');
}
try {
  main();
} catch (error) {
  showError(error);
}
