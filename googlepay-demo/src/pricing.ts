import { ProductType } from 'pcp-client-javascript-sdk';

/** Deliberately fixed DE/EUR sample catalog. Replace with the merchant's authoritative quote. */
export const shippingOptions = [
  { id: 'standard', label: 'Standard', cents: 490 },
  { id: 'express', label: 'Express', cents: 990 },
];

export function quote(countryCode = 'DE', optionId = 'standard') {
  if (countryCode.toUpperCase() !== 'DE') throw new Error('This demo ships only to Germany.');
  const shipping = shippingOptions.find((option) => option.id === optionId);
  if (!shipping) throw new Error('Unknown shipping option.');
  return { subtotal: 1990, shipping: shipping.cents, total: 1990 + shipping.cents, optionId };
}

export const money = (cents: number) => (cents / 100).toFixed(2);

export function shoppingCart(optionId: string) {
  const price = quote('DE', optionId);
  return {
    items: [
      {
        orderLineDetails: {
          productCode: 'GOOGLE-DEMO',
          productName: 'Demo item (tax included)',
          productType: ProductType.GOODS,
          productPrice: price.subtotal,
          quantity: 1,
        },
      },
      {
        orderLineDetails: {
          productCode: optionId,
          productName: 'Shipping',
          productType: ProductType.SHIPMENT,
          productPrice: price.shipping,
          quantity: 1,
        },
      },
    ],
  };
}
