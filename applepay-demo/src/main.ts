/** Standard checkout: freeze merchant contact/shipping before mounting the Apple Pay button. */
import {
  PCPApplePaySession,
  OrderType,
  ProductType,
  type ExpressPaymentReference,
} from 'pcp-client-javascript-sdk';
import { CommerceApiService } from './api/commerce-api.service';
import { ConfigService } from './config';
import { appleInput, mapCreated, mapCheckout, show, showError, showResult } from './utils';
import './style.css';

async function main() {
  const config = new ConfigService();
  const api = new CommerceApiService(config.backendUrl);
  const storageKey = `express:apple:${api.baseUrl}:backend-managed`;
  const returnUrl = `${location.origin}${location.pathname}?returned=1`;
  const form = document.querySelector<HTMLFormElement>('#checkout')!;
  const fields = form.querySelector<HTMLFieldSetElement>('fieldset')!;
  const edit = document.querySelector<HTMLButtonElement>('#edit')!;
  fields.disabled = true;
  if (returnUrl.length > 200) {
    throw new Error(
      'The payment return URL exceeds 200 characters. Serve the demo at a shorter origin/path.',
    );
  }
  let disposed = false;
  let preparing = false;
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
  fields.disabled = false;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (
      disposed ||
      preparing ||
      instance ||
      sessionStorage.getItem(storageKey) ||
      !form.reportValidity()
    ) {
      return;
    }
    const data = new FormData(form);
    const value = (key: string) => String(data.get(key) ?? '').trim();
    const name = { firstName: value('givenName'), surname: value('familyName') };
    const address = {
      countryCode: 'DE',
      city: value('city'),
      zip: value('postalCode'),
      street: value('street'),
      name,
    };
    const customer = {
      billingAddress: { ...address },
      personalInformation: { name },
      contactDetails: { emailAddress: value('email'), phoneNumber: value('phone') },
    };
    const optionId = value('shipping');
    preparing = true;
    fields.disabled = true;
    let active = true;
    try {
      if (optionId !== 'standard' && optionId !== 'express') {
        throw new Error('Unknown shipping option.');
      }
      const shippingCents = optionId === 'express' ? 990 : 490;
      const checkout = await PCPApplePaySession.create(
        {
          applePayVersion: 4,
          countryCode: 'DE',
          currencyCode: 'EUR',
          merchantCapabilities: ['supports3DS'],
          supportedNetworks: ['visa', 'masterCard', 'girocard'],
          total: {
            label: config.merchantName,
            amount: ((1990 + shippingCents) / 100).toFixed(2),
            type: 'final',
          },
          lineItems: [
            { label: 'Demo item (tax included)', amount: '19.90' },
            { label: 'Shipping', amount: (shippingCents / 100).toFixed(2) },
          ],
          validateMerchantURL: config.validateMerchantUrl,
          processPaymentCallback: async (payment) => {
            if (disposed || !active) {
              throw new Error('Apple Pay checkout closed.');
            }
            if (sessionStorage.getItem(storageKey)) {
              throw new Error(
                'An order attempt already exists. Check its status before another payment.',
              );
            }
            // Token comes from Apple; contact and price come from the frozen merchant form.
            const input = appleInput(payment, returnUrl);
            if (!address.city || !address.zip || !address.street || !address.name.surname) {
              throw new Error('A complete final German shipping address is required.');
            }
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
            if (!disposed && active) {
              showResult(result);
            }
          },
          cancelCallback: () => {
            if (!disposed && active) {
              show('Apple Pay cancelled. No new order will be submitted automatically.');
            }
          },
          errorCallback: (_phase, error) => {
            if (!disposed && active) {
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
        active = false;
        checkout.destroy();
        return;
      }
      instance = checkout;
      // The edit listener invalidates callbacks even if a provider event arrives after destroy.
      invalidate = () => {
        active = false;
      };
      edit.hidden = false;
      show('Address and shipping confirmed. Choose Apple Pay to authorize payment.');
    } catch (error) {
      active = false;
      if (!disposed) {
        fields.disabled = !!sessionStorage.getItem(storageKey);
        showError(error);
      }
    } finally {
      preparing = false;
    }
  });
  let invalidate = () => {};
  edit.addEventListener('click', () => {
    if (disposed || preparing) {
      return;
    }
    if (sessionStorage.getItem(storageKey)) {
      show('An order was already submitted. Check payment status before starting again.');
      return;
    }
    invalidate();
    instance?.destroy();
    instance = undefined;
    fields.disabled = false;
    edit.hidden = true;
    show('Update your checkout details and continue again.');
  });
  show('Enter billing/shipping details and choose shipping before opening Apple Pay.');
}

void main().catch(showError);
