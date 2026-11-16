/** Standard checkout: merchant contact form, PAYONE order, then PayPal redirect. */
import { OrderType, ProductType, type ExpressPaymentReference } from 'pcp-client-javascript-sdk';
import { CommerceApiService } from './api/commerce-api.service';
import { ConfigService } from './config';
import { formContact, mapCheckout, mapCreated, show, showError, showResult } from './utils';

async function main() {
  const config = new ConfigService();
  const api = new CommerceApiService(config.backendUrl);
  const storageKey = `paypal:order:${api.baseUrl}`;
  const form = document.querySelector<HTMLFormElement>('#contact')!;
  const fields = document.querySelector<HTMLFieldSetElement>('#fields')!;
  const shipping = document.querySelector<HTMLSelectElement>('#shipping')!;
  const returnUrl = `${location.origin}${location.pathname}?returned=1`;
  if (returnUrl.length > 200) {
    throw new Error('Serve the demo at a shorter origin/path; return URL exceeds 200 characters.');
  }
  let disposed = false;
  window.addEventListener(
    'pagehide',
    () => {
      disposed = true;
    },
    { once: true },
  );

  async function checkStatus() {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as {
      reference?: ExpressPaymentReference;
    } | null;
    if (!saved?.reference?.commerceCaseId || !saved.reference.checkoutId) {
      throw new Error(
        'No checkout IDs available. Reconcile an uncertain attempt in the backend before retrying.',
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
  if (
    new URL(location.href).searchParams.has('returned') ||
    sessionStorage.getItem(`${storageKey}:intent-attempt`)
  ) {
    throw new Error(
      'A PayPal attempt already started. Reconcile it in the backend before another payment.',
    );
  }

  shipping.value = config.shippingOptionId;
  const updateTotal = () => {
    document.querySelector('#total')!.textContent =
      `Total €${((1990 + (shipping.value === 'express' ? 990 : 490)) / 100).toFixed(2)} (including tax)`;
  };
  shipping.addEventListener('change', updateTotal);
  updateTotal();
  fields.disabled = false;
  let submitting = false;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (disposed || submitting || !form.reportValidity()) {
      return;
    }
    try {
      if (
        sessionStorage.getItem(storageKey) ||
        sessionStorage.getItem(`${storageKey}:intent-attempt`)
      ) {
        throw new Error(
          'A PayPal attempt already exists. Check its status before another payment.',
        );
      }
      const contact = formContact(form);
      const optionId = shipping.value;
      if (optionId !== 'standard' && optionId !== 'express') {
        throw new Error('Unknown shipping option.');
      }
      const shippingCents = optionId === 'express' ? 990 : 490;
      const merchantReference = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
      submitting = true;
      fields.disabled = true;
      show('Creating PayPal payment …');
      // Persist before POST: a lost response must not create another payment after reload.
      sessionStorage.setItem(storageKey, JSON.stringify({ phase: 'submitting' }));
      const response = await api.createCommerceCase({
        customer: contact.customer,
        checkout: {
          amountOfMoney: { amount: 1990 + shippingCents, currencyCode: 'EUR' },
          references: { merchantReference },
          shipping: { address: contact.shippingAddress },
          shoppingCart: {
            items: [
              {
                orderLineDetails: {
                  productCode: 'PAYPAL-DEMO',
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
            paymentMethodSpecificInput: {
              redirectPaymentMethodSpecificInput: {
                paymentProductId: 840,
                requiresApproval: false,
                tokenize: false,
                redirectionData: { returnUrl },
                paymentProduct840SpecificInput: {
                  addressSelectionAtPayPal: false,
                  javaScriptSdkFlow: false,
                },
              },
            },
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
      if (!disposed) {
        showResult(mapCreated(response.body, response.status));
      }
    } catch (error) {
      if (!disposed) {
        showError(error);
      }
    }
  });
  show('Enter your billing and delivery address, then continue to PayPal.');
}

void main().catch(showError);
