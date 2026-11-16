/** Express checkout: PayPal address selection, explicit merchant review, then one PAYONE order. */
import {
  PCPPayPalExpress,
  OrderType,
  ProductType,
  type PayPalExpressContext,
  type PaymentIntentResponse,
  type ExpressPaymentReference,
} from 'pcp-client-javascript-sdk';
import { CommerceApiService } from './api/commerce-api.service';
import { ConfigService } from './config';
import { formContact, mapCreated, mapCheckout, show, showError, showResult } from './utils';

async function main() {
  const config = new ConfigService();
  const api = new CommerceApiService(config.backendUrl);
  const storageKey = `paypal:order:${api.baseUrl}`;
  const key = `${storageKey}:intent`;
  const guardKey = `${storageKey}:intent-attempt`;
  const start = document.querySelector<HTMLButtonElement>('#start')!;
  const cancel = document.querySelector<HTMLButtonElement>('#cancel')!;
  const form = document.querySelector<HTMLFormElement>('#contact')!;
  const fields = document.querySelector<HTMLFieldSetElement>('#fields')!;
  const shipping = document.querySelector<HTMLSelectElement>('#shipping')!;
  const returnUrl = `${location.origin}${location.pathname}?returned=1`;
  if (returnUrl.length > 200) {
    throw new Error('Serve the demo at a shorter origin/path; return URL exceeds 200 characters.');
  }
  let disposed = false;
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
  shipping.value = config.shippingOptionId;
  const updateTotal = () => {
    document.querySelector('#total')!.textContent =
      `Total €${((1990 + (shipping.value === 'express' ? 990 : 490)) / 100).toFixed(2)} (including tax)`;
  };
  shipping.addEventListener('change', updateTotal);
  updateTotal();
  const context = JSON.parse(sessionStorage.getItem(key) ?? 'null') as PayPalExpressContext | null;

  const instance = PCPPayPalExpress.create<PaymentIntentResponse>({
    createIntent: async () => {
      if (sessionStorage.getItem(storageKey) || sessionStorage.getItem(guardKey)) {
        throw new Error(
          'A PayPal attempt already exists. Reconcile it before creating another intent.',
        );
      }
      const optionId = shipping.value;
      if (optionId !== 'standard' && optionId !== 'express') {
        throw new Error('Unknown shipping option.');
      }
      const shippingCents = optionId === 'express' ? 990 : 490;
      sessionStorage.setItem(guardKey, 'submitting');
      const response = await api.createPaymentIntent({
        amountOfMoney: { amount: 1990 + shippingCents, currencyCode: 'EUR' },
        references: { merchantReference: crypto.randomUUID().replace(/-/g, '').slice(0, 20) },
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
        paymentMethodSpecificInput: {
          redirectPaymentMethodSpecificInput: {
            paymentProductId: 840,
            requiresApproval: false,
            redirectionData: { returnUrl },
            paymentProduct840SpecificInput: {
              addressSelectionAtPayPal: true,
              javaScriptSdkFlow: false,
            },
          },
        },
      });
      const output = response.body.paymentIntentOutput;
      const redirectUrl = output?.redirectPaymentMethodSpecificOutput?.redirectData?.redirectURL;
      if (!output?.paymentIntentId || !output.paymentId || !redirectUrl) {
        throw new Error('PaymentIntent response lacks IDs or redirectURL.');
      }
      sessionStorage.setItem(guardKey, 'created');
      return { paymentIntentId: output.paymentIntentId, paymentId: output.paymentId, redirectUrl };
    },
    loadIntent: async (saved) => {
      const intent = await api.getPaymentIntent(saved.paymentIntentId);
      if (
        intent.paymentIntentId !== saved.paymentIntentId ||
        intent.paymentId !== saved.paymentId
      ) {
        throw new Error('PaymentIntent correlation mismatch. Do not submit an order.');
      }
      if (
        intent.redirectPaymentMethodSpecificOutput?.paymentProductId !== 840 ||
        !intent.redirectPaymentMethodSpecificOutput.paymentProduct840SpecificOutput?.shippingAddress
      ) {
        throw new Error('No PayPal shipping address received. Do not submit an order.');
      }
      return intent;
    },
    confirmPayment: async (intent, saved) => {
      if (sessionStorage.getItem(storageKey)) {
        throw new Error(
          'An order attempt already exists. Check its status before another payment.',
        );
      }
      const output = intent.redirectPaymentMethodSpecificOutput!.paymentProduct840SpecificOutput!;
      const address = formContact(form).shippingAddress;
      if (
        address.countryCode !== 'DE' ||
        !address.city ||
        !address.zip ||
        !address.street ||
        !address.name.surname
      ) {
        throw new Error('A complete final German shipping address is required.');
      }
      const optionId = shipping.value;
      if (optionId !== 'standard' && optionId !== 'express') {
        throw new Error('Unknown shipping option.');
      }
      const shippingCents = optionId === 'express' ? 990 : 490;
      const merchantReference = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
      sessionStorage.setItem(storageKey, JSON.stringify({ phase: 'submitting' }));
      const response = await api.createCommerceCase({
        customer: {
          billingAddress: output.billingAddress,
          personalInformation: {
            name: {
              firstName: output.customerAccount?.firstName,
              surname: output.customerAccount?.surname,
            },
          },
          contactDetails: { emailAddress: output.customerAccount?.emailAddress },
        },
        checkout: {
          amountOfMoney: { amount: 1990 + shippingCents, currencyCode: 'EUR' },
          references: { merchantReference },
          shipping: { address },
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
                  paymentId: saved.paymentId,
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
      return mapCreated(response.body, response.status);
    },
    contextChangedCallback: (saved) => {
      if (saved) {
        sessionStorage.setItem(key, JSON.stringify(saved));
      } else {
        sessionStorage.removeItem(key);
      }
    },
    resultCallback: (payment) => {
      if (!disposed) {
        // PCPPayPalExpress navigates after persisting the confirmation result.
        show(
          payment.status === 'failed'
            ? `${payment.code}: ${payment.message}`
            : `Payment ${payment.status}. Check payment status after return.`,
        );
      }
    },
    cancelCallback: () => {
      sessionStorage.removeItem(guardKey);
      if (!disposed) {
        fields.disabled = true;
        start.disabled = false;
        cancel.disabled = true;
        show('Local PayPal review cancelled. No CommerceCase order was submitted.');
      }
    },
    errorCallback: (error) => {
      if (!disposed) {
        showError(error);
      }
    },
  });
  window.addEventListener(
    'pagehide',
    () => {
      disposed = true;
    },
    { once: true },
  );
  start.addEventListener('click', async () => {
    if (disposed || start.disabled) {
      return;
    }
    start.disabled = true;
    show('Creating PayPal PaymentIntent …');
    try {
      await instance.start();
    } catch (error) {
      if (!disposed) {
        showError(error);
      }
    }
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (disposed || fields.disabled || !form.reportValidity()) {
      return;
    }
    // confirm() reads the form synchronously, before disabled controls disappear from FormData.
    const confirmation = instance.confirm();
    fields.disabled = true;
    cancel.disabled = true;
    try {
      await confirmation;
    } catch (error) {
      if (!disposed) {
        showError(error);
      }
    }
  });
  cancel.addEventListener('click', () => {
    try {
      instance.cancel();
    } catch (error) {
      showError(error);
    }
  });

  if (context) {
    const intent = await instance.resume(context);
    if (disposed) {
      return;
    }
    if (context.phase !== 'redirected' && context.phase !== 'review') {
      show(
        'An order confirmation already started. Reconcile it in the backend; do not submit again.',
      );
      return;
    }
    const output = intent.redirectPaymentMethodSpecificOutput!.paymentProduct840SpecificOutput!;
    const address = output.shippingAddress!;
    const values = {
      firstName: address.name?.firstName,
      surname: address.name?.surname,
      street: [address.street, address.houseNumber].filter(Boolean).join(' '),
      zip: address.zip,
      city: address.city,
      additionalInfo: address.additionalInfo,
    };
    for (const [name, value] of Object.entries(values)) {
      (form.elements.namedItem(name) as HTMLInputElement).value = value ?? '';
    }
    document.querySelector('#account')!.textContent =
      `PayPal account: ${output.customerAccount?.emailAddress ?? 'not supplied'}. Delivery country: ${address.countryCode ?? 'not supplied'}.`;
    if (address.countryCode !== 'DE') {
      show('This demo ships only to Germany. Cancel this local review to start again.');
      cancel.disabled = false;
      return;
    }
    fields.disabled = false;
    cancel.disabled = false;
    show(
      'Verify the delivery address and shipping price, then place your order. PayPal approval alone is not a completed payment.',
    );
  } else if (
    sessionStorage.getItem(guardKey) ||
    new URL(location.href).searchParams.has('returned')
  ) {
    show(
      'A PayPal attempt started without saved return context. Reconcile it in the backend before retrying.',
    );
  } else {
    start.disabled = false;
    show('Continue to PayPal to select your delivery address.');
  }
}

void main().catch(showError);
