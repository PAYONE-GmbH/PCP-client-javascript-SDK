/** Official PayPal button: freeze shop contact, create through PAYONE and synchronize once on exit. */
import { loadScript, type PayPalButtonsComponent } from '@paypal/paypal-js';
import {
  OrderType,
  ProductType,
  type ExpressPaymentReference,
  type ExpressPaymentResult,
} from 'pcp-client-javascript-sdk';
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
  const edit = document.querySelector<HTMLButtonElement>('#edit')!;
  const returnUrl = `${location.origin}${location.pathname}?returned=1`;
  if (returnUrl.length > 200) {
    throw new Error('Serve the demo at a shorter origin/path; return URL exceeds 200 characters.');
  }
  let disposed = false;
  let preparing = false;
  let buttons: PayPalButtonsComponent | undefined;
  let closeButtons: (() => Promise<void>) | undefined;
  window.addEventListener(
    'pagehide',
    () => {
      disposed = true;
      void closeButtons?.().catch(showError);
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
    const result = mapCheckout(response.body, saved.reference);
    if (!disposed) {
      showResult(result);
    }
    return result;
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
  // Validate SDK-only settings before enabling the form.
  config.clientId;
  config.merchantId;
  config.intent;
  config.locale;
  shipping.value = config.shippingOptionId;
  const updateTotal = () => {
    document.querySelector('#total')!.textContent =
      `Total €${((1990 + (shipping.value === 'express' ? 990 : 490)) / 100).toFixed(2)} (including tax)`;
  };
  shipping.addEventListener('change', updateTotal);
  updateTotal();
  fields.disabled = false;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (
      disposed ||
      preparing ||
      buttons ||
      sessionStorage.getItem(storageKey) ||
      !form.reportValidity()
    ) {
      return;
    }
    const contact = formContact(form);
    const optionId = shipping.value;
    preparing = true;
    fields.disabled = true;
    try {
      if (optionId !== 'standard' && optionId !== 'express') {
        throw new Error('Unknown shipping option.');
      }
      const shippingCents = optionId === 'express' ? 990 : 490;
      show('Loading PayPal button …');
      const paypal = await loadScript({
        clientId: config.clientId,
        merchantId: config.merchantId,
        currency: 'EUR',
        intent: config.intent,
        locale: config.locale,
        commit: true,
        vault: false,
        components: ['buttons'],
        disableFunding: ['card', 'sepa', 'bancontact'],
      });
      if (disposed) {
        return;
      }
      if (!paypal?.Buttons) {
        throw new Error('PayPal SDK could not be loaded.');
      }
      let closed = false;
      let order:
        | Promise<{ commerceCaseId: string; checkoutId: string; orderId: string }>
        | undefined;
      let completion: Promise<ExpressPaymentResult> | undefined;
      let finalized = false;

      async function createOrder() {
        if (disposed || closed || finalized) {
          throw new Error('This PayPal attempt is closed. Reconcile before retrying.');
        }
        if (
          sessionStorage.getItem(storageKey) ||
          sessionStorage.getItem(`${storageKey}:intent-attempt`)
        ) {
          throw new Error(
            'A PayPal attempt already exists. Check its status before another payment.',
          );
        }
        edit.disabled = true;
        const merchantReference = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
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
                  requiresApproval: config.intent === 'authorize',
                  tokenize: false,
                  redirectionData: { returnUrl },
                  paymentProduct840SpecificInput: {
                    addressSelectionAtPayPal: false,
                    javaScriptSdkFlow: true,
                  },
                },
              },
            },
          },
        });
        const payment = response.body.checkout?.paymentResponse?.payment;
        const reference = {
          commerceCaseId: response.body.commerceCaseId,
          checkoutId: response.body.checkout?.checkoutId,
          paymentId: payment?.id,
        };
        const orderId =
          payment?.paymentOutput?.redirectPaymentMethodSpecificOutput?.payPalTransactionId;
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({ phase: 'created', reference, sdkOrderId: orderId }),
        );
        const result = mapCreated(response.body, response.status);
        if (result.status === 'failed') {
          throw new Error(result.message);
        }
        if (!reference.commerceCaseId || !reference.checkoutId || !orderId) {
          throw new Error(
            'PAYONE SDK response lacks checkout IDs or payPalTransactionId. Reconcile the saved attempt.',
          );
        }
        return {
          commerceCaseId: reference.commerceCaseId,
          checkoutId: reference.checkoutId,
          orderId,
        };
      }

      async function completeOrder(saved: Awaited<ReturnType<typeof createOrder>>) {
        const attempt = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
        if (
          attempt?.sdkOrderId !== saved.orderId ||
          attempt.reference?.commerceCaseId !== saved.commerceCaseId ||
          attempt.reference?.checkoutId !== saved.checkoutId
        ) {
          throw new Error('PayPal completion correlation mismatch.');
        }
        if (attempt.completion) {
          throw new Error(
            'Completion already started. Check checkout status; do not repeat the POST.',
          );
        }
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({ ...attempt, completion: 'submitting' }),
        );
        const response = await api.completeOrder(saved.commerceCaseId, saved.checkoutId, {
          completePaymentMethodSpecificInput: {
            paymentProduct840SpecificInput: {
              javaScriptSdkFlow: true,
              action: 'CONFIRM_ORDER_STATUS',
            },
          },
        });
        sessionStorage.setItem(storageKey, JSON.stringify({ ...attempt, completion: 'completed' }));
        const result = mapCreated(
          {
            checkout: {
              errorResponse: response.body.errorResponse,
              paymentResponse: { payment: response.body.payment },
            },
          },
          response.status,
        );
        if (result.status === 'failed') {
          return result;
        }
        const checkout = await api.getCheckout(saved.commerceCaseId, saved.checkoutId);
        return mapCheckout(checkout.body, saved);
      }

      async function finalize(kind: 'approve' | 'cancel' | 'error', orderID?: string) {
        if (disposed || closed || !order) {
          return;
        }
        const saved = await order;
        if (orderID && saved.orderId !== orderID) {
          throw new Error('PayPal callback orderID mismatch.');
        }
        if (disposed || closed || finalized) {
          return;
        }
        finalized = true;
        completion ??= completeOrder(saved);
        const result = await completion;
        if (!disposed && !closed) {
          if (kind === 'cancel' && result.status !== 'succeeded' && result.status !== 'failed') {
            show(
              'PayPal window cancelled. PAYONE status synchronized; check payment status before another attempt.',
            );
          } else {
            showResult(result);
          }
        }
      }
      const report = (error: unknown) => {
        if (!disposed && !closed) {
          showError(error);
        }
      };
      const current = paypal.Buttons({
        fundingSource: paypal.FUNDING?.PAYPAL,
        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
        createOrder: () => {
          if (disposed || closed || finalized) {
            return Promise.reject(
              new Error('This PayPal attempt is closed. Reconcile before retrying.'),
            );
          }
          order ??= createOrder();
          return order.then((saved) => saved.orderId);
        },
        onApprove: (data) =>
          finalize('approve', data.orderID).catch((error) => {
            report(error);
            throw error;
          }),
        onCancel: async (data) => {
          if (!order && !disposed && !closed) {
            show('PayPal window cancelled. No order was submitted.');
          } else {
            await finalize(
              'cancel',
              typeof data.orderID === 'string' ? data.orderID : undefined,
            ).catch(report);
          }
        },
        onError: (error) => {
          report(error);
          void finalize('error').catch(report);
        },
      });
      if (!current.isEligible()) {
        throw new Error('PayPal is not eligible in this browser/configuration.');
      }
      // Invalidate the callbacks as well as removing the button when editing.
      closeButtons = async () => {
        closed = true;
        await current.close();
      };
      buttons = current;
      await current.render(document.querySelector<HTMLElement>('#paypal-button')!);
      if (disposed) {
        await closeButtons();
        return;
      }
      edit.disabled = !!sessionStorage.getItem(storageKey);
      show('Use the PayPal button. The shop address and price are fixed for this attempt.');
    } catch (error) {
      await closeButtons?.();
      buttons = undefined;
      if (!disposed) {
        fields.disabled = !!sessionStorage.getItem(storageKey);
        showError(error);
      }
    } finally {
      preparing = false;
    }
  });
  edit.addEventListener('click', async () => {
    if (disposed || preparing || !buttons || sessionStorage.getItem(storageKey)) {
      return;
    }
    preparing = true;
    edit.disabled = true;
    try {
      await closeButtons?.();
      buttons = undefined;
      if (!disposed) {
        fields.disabled = false;
        show('Edit your address or shipping option, then prepare the PayPal button again.');
      }
    } catch (error) {
      showError(error);
    } finally {
      preparing = false;
    }
  });
  show('Enter your billing and delivery address, then prepare the PayPal button.');
}

void main().catch(showError);
