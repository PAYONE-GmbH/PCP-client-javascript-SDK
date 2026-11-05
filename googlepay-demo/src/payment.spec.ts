import { expect, it } from 'vitest';
import { googleContact, googleCustomer, googleInput } from './payment';

it('Base64-encodes the original Google token exactly once including UTF-8', () => {
  const token = '{"encrypted":"ä€"}';
  const payment = {
    paymentMethodData: { tokenizationData: { token } },
  } as google.payments.api.PaymentData;
  const input = googleInput(payment, 'https://demo.test/return');
  expect(input.paymentProductId).toBe(320);
  expect(
    new TextDecoder().decode(
      Uint8Array.from(atob(input.encryptedPaymentData!), (char) => char.charCodeAt(0)),
    ),
  ).toBe(token);
});

it('rejects missing tokens and maps final billing/shipping details separately', () => {
  expect(() =>
    googleInput(
      { paymentMethodData: { tokenizationData: { token: '' } } } as google.payments.api.PaymentData,
      'https://shop.test/',
    ),
  ).toThrow('token');
  const payment = {
    email: 'buyer@example.test',
    shippingAddress: { name: 'Shipping Buyer', countryCode: 'DE', phoneNumber: '+49123' },
    paymentMethodData: {
      info: {
        billingAddress: {
          name: 'Billing Buyer',
          address1: 'Example 1',
          countryCode: 'DE',
          administrativeArea: 'BE',
        },
      },
    },
  } as google.payments.api.PaymentData;
  expect(googleCustomer(payment)).toMatchObject({
    billingAddress: { street: 'Example 1', state: 'BE' },
    personalInformation: { name: { firstName: 'Billing', surname: 'Buyer' } },
    contactDetails: { emailAddress: 'buyer@example.test', phoneNumber: '+49123' },
  });
  expect(googleContact(payment.shippingAddress!).name?.firstName).toBe('Shipping');
  expect(() => googleCustomer({ ...payment, email: undefined })).toThrow('customer');
});

it.each([undefined, '', '   ', 'Berlin', 'DE-BE'])(
  'omits an unsupported optional state (%s) from both Commerce addresses',
  (administrativeArea) => {
    const address = {
      name: 'Example Buyer',
      countryCode: 'DE',
      locality: 'Berlin',
      postalCode: '12345',
      address1: 'Example 1',
      administrativeArea,
    } as google.payments.api.Address;
    const payment = {
      email: 'buyer@example.test',
      shippingAddress: address,
      paymentMethodData: { info: { billingAddress: address } },
    } as google.payments.api.PaymentData;
    const payload = JSON.parse(
      JSON.stringify({
        customer: googleCustomer(payment),
        checkout: { shipping: { address: googleContact(address) } },
      }),
    );
    expect(payload.customer.billingAddress).not.toHaveProperty('state');
    expect(payload.checkout.shipping.address).not.toHaveProperty('state');
    expect(payload.customer.billingAddress).toMatchObject({ city: 'Berlin', zip: '12345' });
  },
);

it('trims a valid short state code without truncating or inventing codes', () => {
  expect(
    googleContact({ countryCode: 'DE', administrativeArea: ' BE ' } as google.payments.api.Address),
  ).toHaveProperty('state', 'BE');
});
