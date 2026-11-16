/** Express example: Google collects contacts/shipping, updates totals, then submits the order.
 * Adapt sample prices/cart; the merchant server validates them and enforces idempotency.
 */
import {
  PCPGooglePayExpress,
  OrderType,
  ProductType,
  type ExpressPaymentReference,
} from 'pcp-client-javascript-sdk';
import { CommerceApiService } from './api/commerce-api.service';
import { ConfigService } from './config';
import {
  googleContact,
  googleCustomer,
  googleInput,
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
  const key = `google:express:${api.baseUrl}`;
  const params = new URL(location.href).searchParams;
  const returnUrl = `${location.origin}${location.pathname}?returned=1`;
  if (returnUrl.length > 200) {
    throw new Error('Serve the demo at a shorter URL (3DS return maximum: 200 characters).');
  }
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
    await checkStatus();
    return;
  }
  let optionId = 'standard';
  let disposed = false;
  let checkout: PCPGooglePayExpress | undefined;
  window.addEventListener(
    'pagehide',
    () => {
      disposed = true;
      checkout?.destroy();
    },
    { once: true },
  );
  checkout = await PCPGooglePayExpress.create(
    {
      environment: config.environment,
      buttonOptions: {
        buttonType: 'buy',
        buttonLocale: config.buttonLocale,
      },
      paymentRequest: {
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
              billingAddressRequired: true,
              billingAddressParameters: { format: 'FULL', phoneNumberRequired: true },
            },
            tokenizationSpecification: {
              type: 'PAYMENT_GATEWAY',
              parameters: { gateway: 'payonegmbh', gatewayMerchantId: config.gatewayMerchantId },
            },
          },
        ],
        emailRequired: true,
        shippingAddressRequired: true,
        shippingOptionRequired: true,
        shippingAddressParameters: { allowedCountryCodes: ['DE'], phoneNumberRequired: true },
        shippingOptionParameters: {
          defaultSelectedOptionId: 'standard',
          shippingOptions: [
            { id: 'standard', label: 'Standard €4.90' },
            { id: 'express', label: 'Express €9.90' },
          ],
        },
        transactionInfo: {
          countryCode: 'DE',
          currencyCode: 'EUR',
          totalPriceStatus: 'ESTIMATED',
          totalPrice: '24.80',
          totalPriceLabel: 'Total',
          displayItems: [
            { label: 'Item (tax included)', type: 'SUBTOTAL', price: '19.90' },
            { label: 'Shipping', type: 'LINE_ITEM', price: '4.90' },
          ],
        },
        callbackIntents: ['PAYMENT_AUTHORIZATION', 'SHIPPING_ADDRESS', 'SHIPPING_OPTION'],
      },
      // Intermediate addresses are redacted. Update prices only; never submit here.
      paymentDataChangedCallback: async (data) => {
        if (data.shippingAddress?.countryCode && data.shippingAddress.countryCode !== 'DE') {
          return {
            error: {
              intent: 'SHIPPING_ADDRESS',
              reason: 'SHIPPING_ADDRESS_UNSERVICEABLE',
              message: 'Delivery is only available in Germany.',
            },
          };
        }
        const selected = data.shippingOptionData?.id;
        if (selected && selected !== 'shipping_option_unselected') {
          if (selected !== 'standard' && selected !== 'express') {
            throw new Error('Unknown shipping option.');
          }
          optionId = selected;
        }
        const shippingPrice = optionId === 'express' ? '9.90' : '4.90';
        return {
          newTransactionInfo: {
            countryCode: 'DE',
            currencyCode: 'EUR',
            totalPriceStatus: 'FINAL',
            totalPrice: optionId === 'express' ? '29.80' : '24.80',
            totalPriceLabel: 'Total',
            displayItems: [
              { label: 'Item (tax included)', type: 'SUBTOTAL', price: '19.90' },
              { label: 'Shipping', type: 'LINE_ITEM', price: shippingPrice },
            ],
          },
          newShippingOptionParameters: {
            defaultSelectedOptionId: optionId,
            shippingOptions: [
              { id: 'standard', label: 'Standard €4.90' },
              { id: 'express', label: 'Express €9.90' },
            ],
          },
        };
      },
      processPaymentCallback: async (payment) => {
        if (sessionStorage.getItem(key)) {
          throw new Error('Order already submitted. Check payment status.');
        }
        if (payment.shippingOptionData?.id !== optionId) {
          throw new Error('Final shipping option does not match the displayed total.');
        }
        if (!payment.shippingAddress) {
          throw new Error('Missing final shipping address.');
        }
        const address = googleContact(payment.shippingAddress);
        if (
          address.countryCode !== 'DE' ||
          !address.street ||
          !address.city ||
          !address.zip ||
          !address.name?.surname
        ) {
          throw new Error('A complete German shipping address is required.');
        }
        const customer = googleCustomer(payment);
        const input = googleInput(payment, returnUrl);
        const shippingPrice = optionId === 'express' ? 990 : 490;
        const reference = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
        // Final full contacts and token are available only now. Google callbacks have a 30s deadline.
        const request = {
          customer,
          checkout: {
            amountOfMoney: { amount: 1990 + shippingPrice, currencyCode: 'EUR' },
            references: { merchantReference: reference },
            shipping: { address },
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
                    productCode: optionId,
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
        return mapCreated(response.body, response.status);
      },
      resultCallback: showResult,
      errorCallback: (error) => {
        if (!disposed) {
          showError(error);
        }
      },
      cancelCallback: () => {
        optionId = 'standard';
        if (!disposed) {
          show('Google Pay cancelled.');
        }
      },
    },
    { selector: '#wallet' },
  );
  if (disposed) {
    checkout.destroy();
    return;
  }
  show('Choose Google Pay and select address/shipping inside the wallet.');
}
void main().catch(showError);
