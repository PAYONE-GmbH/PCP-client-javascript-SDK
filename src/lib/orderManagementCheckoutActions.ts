/**
 * Order Management Checkout Actions allow operations on the items of a shopping cart. Requires ORDER_MANAGEMENT as allowedPaymentActions.
 */
import {
  CancelRequest,
  CancelResponse,
  DeliverRequest,
  DeliverResponse,
  OrderRequest,
  OrderResponse,
  ReturnRequest,
  ReturnResponse,
} from '../interfaces';

/**
 * Creates an Order that will automatially execute a Payment
 * @description This method can be used to create an Order that automatically executes a payment for the respective Checkout. The Order request requires items within the ShoppingCart and can be made for a partial or the entire ShoppingCart of a Checkout.
 * @param {string} merchantId
 * @param {string} commerceCaseId
 * @param {string} checkoutId
 * @param {OrderRequest} body
 * @returns {Promise<OrderResponse>}
 */
export const createOrder = (
  merchantId: string,
  commerceCaseId: string,
  checkoutId: string,
  body: OrderRequest,
): Promise<OrderResponse> => {
  console.log('createOrder', merchantId, commerceCaseId, checkoutId, body);
  return Promise.resolve({});
};

/**
 * Mark items of a Checkout as delivered and automatically capture the payment for the items
 * @description This method can be used to mark items from a Checkout as delivered and to automatically capture the payments for those items. The return can only be done for Checkouts with status COMPLETED, BILLED or CHARGEBACKED and the items have to be in the status ORDERED. If the payment has already been captured (in case of a SALE), the deliver request will only update the item status.
 * @param {string} merchantId
 * @param {string} commerceCaseId
 * @param {string} checkoutId
 * @param {DeliverRequest} body
 * @returns {Promise<DeliverResponse>}
 */
export const markItemsAsDelivered = (
  merchantId: string,
  commerceCaseId: string,
  checkoutId: string,
  body: DeliverRequest,
): Promise<DeliverResponse> => {
  console.log('deliver', merchantId, commerceCaseId, checkoutId, body);
  return Promise.resolve({});
};

/**
 * Mark items of a Checkout as returned and automatically refund the payment for the items
 * @description This method can be used to mark items from a Checkout as returned and will automatically refund the payments for those items. The return can only be done for Checkouts with status BILLED or CHARGEBACKED and the items have to be in the status DELIVERED.
 * @param {string} merchantId
 * @param {string} commerceCaseId
 * @param {string} checkoutId
 * @param {ReturnRequest} body
 * @returns {Promise<ReturnResponse>}
 */
export const markItemsAsReturned = (
  merchantId: string,
  commerceCaseId: string,
  checkoutId: string,
  body: ReturnRequest,
): Promise<ReturnResponse> => {
  console.log('return', merchantId, commerceCaseId, checkoutId, body);
  return Promise.resolve({});
};

/**
 * Mark items of a Checkout as cancelled and automatically cancel the payment for the items
 * @description This method can be used to mark items from a Checkout as cancelled and reverse the payment associated with this Checkout. The Cancel method can be used to cancel a full or partial order. The Cancel request will mark all or (for cancelType PARTIAL) the provided items as CANCELLED, and – in case of an existing authorization – will reverse the payment.
 *
 * In the light of card payments, reversing an authorization that is not needed will prevent you from having to pay a fee/penalty for unused authorization requests. Whilst scheme regulations require that acquirers and PSPs support authorization reversals, there are no rules towards issuers mandating them to process the reversal advice. Therefore, there is no guarantee the authorization hold is released. The authorization reversal can only be performed by the card issuer, and under no circumstances will we be responsible for performing the authorization reversal.
 *
 * The cancellationReason is mandatory for BNPL payment methods (paymentProductId 3390, 3391 and 3392). For other payment methods the cancellationReason is not mandatory but can be used for reporting and reconciliation purposes.
 * @param {string} merchantId
 * @param {string} commerceCaseId
 * @param {string} checkoutId
 * @param {CancelRequest} body
 * @returns {Promise<CancelResponse>}
 */
export const markItemsAsCancelled = (
  merchantId: string,
  commerceCaseId: string,
  checkoutId: string,
  body: CancelRequest,
): Promise<CancelResponse> => {
  console.log('cancel', merchantId, commerceCaseId, checkoutId, body);
  return Promise.resolve({});
};
