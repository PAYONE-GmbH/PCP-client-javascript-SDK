/** Express checkout: Apple collects final contacts; shipping callbacks update quotes only. */
import {
  PCPApplePaySession,
  OrderType,
  ProductType,
  type ExpressPaymentReference,
} from 'pcp-client-javascript-sdk';
import { CommerceApiService } from './api/commerce-api.service';
import { ConfigService } from './config';
import {
  appleContact,
  appleCustomer,
  appleInput,
  mapCreated,
  mapCheckout,
  show,
  showError,
  showResult,
} from './utils';
import './style.css';

async function main() {
  const config = new ConfigService();
  const api = new CommerceApiService(config.backendUrl);
  const storageKey = `express:apple:${api.baseUrl}:backend-managed`;
  const returnUrl = `${location.origin}${location.pathname}?returned=1`;
  if (returnUrl.length > 200) {
    throw new Error(
      'The payment return URL exceeds 200 characters. Serve the demo at a shorter origin/path.',
    );
  }
  let disposed = false;
  let instance: PCPApplePaySession | undefined;
  window.addEventListener(
    'pagehide',
    () => {
      disposed = true;
      instance?.destroy();
    },
    { once: true },
  );
  async function checkStatus() {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as {
      reference?: ExpressPaymentReference;
    } | null;
    if (!saved?.reference?.commerceCaseId || !saved.reference.checkoutId) {
      throw new Error(
        'No checkout IDs available. Reconcile an uncertain POST in the backend before retrying.',
      );
    }
    const response = await api.getCheckout(
      saved.reference.commerceCaseId,
      saved.reference.checkoutId,
    );
    if (!disposed) {
      showResult(mapCheckout(response.body, saved.reference));
    }
  }
  document.querySelector('#check-status')!.addEventListener('click', () => {
    void checkStatus().catch(showError);
  });
  if (sessionStorage.getItem(storageKey)) {
    await checkStatus();
    return;
  }
  if (new URL(location.href).searchParams.has('returned')) {
    throw new Error(
      'No saved Apple Pay attempt found. Reconcile the payment in the backend before starting again.',
    );
  }
  let optionId = 'standard';
  const methods: ApplePayJS.ApplePayShippingMethod[] = [
    { identifier: 'standard', label: 'Standard', detail: 'Delivery in Germany', amount: '4.90' },
    { identifier: 'express', label: 'Express', detail: 'Delivery in Germany', amount: '9.90' },
  ];
  // A small local quote update; the complete initial wallet request stays visible below.
  const update = () => ({
    newTotal: {
      label: config.merchantName,
      amount: optionId === 'express' ? '29.80' : '24.80',
      type: 'final' as const,
    },
    newLineItems: [
      { label: 'Demo item (tax included)', amount: '19.90' },
      { label: 'Shipping', amount: optionId === 'express' ? '9.90' : '4.90' },
    ],
    newShippingMethods: methods,
  });
  const checkout = await PCPApplePaySession.create(
    {
      applePayVersion: 4,
      countryCode: 'DE',
      currencyCode: 'EUR',
      merchantCapabilities: ['supports3DS'],
      supportedNetworks: ['visa', 'masterCard', 'girocard'],
      total: { label: config.merchantName, amount: '24.80', type: 'final' },
      lineItems: [
        { label: 'Demo item (tax included)', amount: '19.90' },
        { label: 'Shipping', amount: '4.90' },
      ],
      validateMerchantURL: config.validateMerchantUrl,
      requiredShippingContactFields: ['postalAddress', 'name', 'email', 'phone'],
      requiredBillingContactFields: ['postalAddress', 'name'],
      shippingMethods: methods,
      shippingContactAddressSelectedCallback: async (contact) => {
        if (contact.countryCode && contact.countryCode.toUpperCase() !== 'DE') {
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
        }
        return update();
      },
      shippingMethodSelectedCallback: async (method) => {
        if (method.identifier !== 'standard' && method.identifier !== 'express') {
          throw new Error('Unknown shipping option.');
        }
        optionId = method.identifier;
        return update();
      },
      processPaymentCallback: async (payment) => {
        if (disposed) {
          throw new Error('Apple Pay checkout closed.');
        }
        if (sessionStorage.getItem(storageKey)) {
          throw new Error(
            'An order attempt already exists. Check its status before another payment.',
          );
        }
        const input = appleInput(payment, returnUrl);
        const address = appleContact(payment.shippingContact);
        const customer = appleCustomer(payment);
        if (
          address.countryCode !== 'DE' ||
          !address.city ||
          !address.zip ||
          !address.street ||
          !address.name?.surname
        ) {
          throw new Error('A complete final German shipping address is required.');
        }
        const shippingCents = optionId === 'express' ? 990 : 490;
        const merchantReference = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
        sessionStorage.setItem(storageKey, JSON.stringify({ phase: 'submitting' }));
        const response = await api.createCommerceCase({
          customer,
          checkout: {
            amountOfMoney: { amount: 1990 + shippingCents, currencyCode: 'EUR' },
            references: { merchantReference },
            shipping: { address },
            shoppingCart: {
              items: [
                {
                  orderLineDetails: {
                    productCode: 'EXPRESS-DEMO',
                    productType: ProductType.GOODS,
                    productPrice: 1990,
                    quantity: 1,
                  },
                },
                {
                  orderLineDetails: {
                    productCode: optionId,
                    productType: ProductType.SHIPMENT,
                    productPrice: shippingCents,
                    quantity: 1,
                  },
                },
              ],
            },
            autoExecuteOrder: true,
            orderRequest: {
              orderType: OrderType.FULL,
              orderReferences: { merchantReference },
              paymentMethodSpecificInput: { mobilePaymentMethodSpecificInput: input },
            },
          },
        });
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            phase: 'created',
            reference: {
              commerceCaseId: response.body.commerceCaseId,
              checkoutId: response.body.checkout?.checkoutId,
              paymentId: response.body.checkout?.paymentResponse?.payment?.id,
            },
          }),
        );
        return mapCreated(response.body, response.status);
      },
      resultCallback: (result) => {
        if (!disposed) {
          showResult(result);
        }
      },
      cancelCallback: () => {
        optionId = 'standard';
        if (!disposed) {
          show('Apple Pay cancelled. No new order will be submitted automatically.');
        }
      },
      errorCallback: (_phase, error) => {
        optionId = 'standard';
        if (!disposed) {
          showError(error);
        }
      },
    },
    {
      selector: '#wallet',
      config: {
        buttonstyle: 'black',
        type: 'check-out',
        locale: config.buttonLocale,
        style: { width: '240px', height: '44px' },
      },
    },
  );
  if (disposed) {
    checkout.destroy();
    return;
  }
  instance = checkout;
  show('Choose Apple Pay to select your address and shipping inside the wallet.');
}

void main().catch(showError);
