/**
 * Resource for the operations on Checkouts.
 */
import {
  CheckoutResponse,
  CheckoutsResponse,
  CreateCheckoutRequest,
  CreateCheckoutResponse,
  GetCheckoutsQueryParams,
  PatchCheckoutRequest,
} from '../interfaces';

/**
 * Add a Checkout to an existing Commerce Case
 * @description This method can be used to add a new Checkout in combination with an Order to an existing Commerce Case. The Order can either be directly executed or the paymentMethodSpecificInput can also be stored for a later execution over the OrderManagementCheckout Action or Payment Execution method.
 * @param {string} merchantId
 * @param {string} commerceCaseId
 * @param {CreateCheckoutRequest} body
 * @returns {Promise<CreateCheckoutResponse>}
 */
export const createCheckout = (
  merchantId: string,
  commerceCaseId: string,
  body: CreateCheckoutRequest,
): Promise<CreateCheckoutResponse> => {
  console.log('createCheckout', merchantId, commerceCaseId, body);
  return Promise.resolve({});
};

/**
 * Get Checkout Details
 * @description This method can be used to get a Checkout.
 * @param {string} merchantId
 * @param {string} commerceCaseId
 * @param {string} checkoutId
 * @returns {Promise<CheckoutResponse>}
 */
export const getCheckout = (
  merchantId: string,
  commerceCaseId: string,
  checkoutId: string,
): Promise<CheckoutResponse> => {
  console.log('getCheckout', merchantId, commerceCaseId, checkoutId);
  return Promise.resolve({});
};

/**
 * Modify a Checkout
 * @description This method can be used to update or modify the data of a Checkout.
 * @param {string} merchantId
 * @param {string} commerceCaseId
 * @param {string} checkoutId
 * @param {PatchCheckoutRequest} body
 * @returns {Promise<void>}
 */
export const patchCheckout = (
  merchantId: string,
  commerceCaseId: string,
  checkoutId: string,
  body: PatchCheckoutRequest,
): Promise<void> => {
  console.log('patchCheckout', merchantId, commerceCaseId, checkoutId, body);
  return Promise.resolve();
};

/**
 * Delete a Checkout
 * @description This method can be used to delete an unused Checkout.
 * @param {string} merchantId
 * @param {string} commerceCaseId
 * @param {string} checkoutId
 * @returns {Promise<void>}
 */
export const deleteCheckout = (
  merchantId: string,
  commerceCaseId: string,
  checkoutId: string,
): Promise<void> => {
  console.log('deleteCheckout', merchantId, commerceCaseId, checkoutId);
  return Promise.resolve();
};

/**
 * Get a list of Checkouts based on Search Parameters
 * @description This method will provide a list of Checkouts based on the provided criteria. Not all parameters are required to be set. Results will be returned in descending creation time per default. Only up to the first 10,000 results will be returned.
 * @param {string} merchantId
 * @param {GetCheckoutsQueryParams} query
 * @returns {Promise<CheckoutsResponse>}
 */
export const getCheckouts = (
  merchantId: string,
  query: GetCheckoutsQueryParams,
): Promise<CheckoutsResponse> => {
  console.log('getCheckouts', merchantId, query);
  return Promise.resolve({});
};
