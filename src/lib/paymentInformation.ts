/**
 * Resource for operations on Payment Information.
 */
import {
  PaymentInformationRequest,
  PaymentInformationResponse,
} from '../interfaces';

/**
 * Create a Payment Information
 * @description Creates a new Payment Information for the given Checkout.
 * @param {string} merchantId
 * @param {string} commerceCaseId
 * @param {string} checkoutId
 * @param {PaymentInformationRequest} body
 * @returns {Promise<PaymentInformationResponse>}
 */
export const createPaymentInformation = (
  merchantId: string,
  commerceCaseId: string,
  checkoutId: string,
  body: PaymentInformationRequest,
): Promise<PaymentInformationResponse> => {
  console.log(
    'createPaymentInformation',
    merchantId,
    commerceCaseId,
    checkoutId,
    body,
  );
  return Promise.resolve({});
};

/**
 * Get a Payment Information
 * @description This method can be used to get a paymentInformation of a Checkout.
 * @param {string} merchantId
 * @param {string} commerceCaseId
 * @param {string} checkoutId
 * @param {string} paymentInformationId
 * @returns {Promise<PaymentInformationResponse>}
 */
export const getPaymentInformation = (
  merchantId: string,
  commerceCaseId: string,
  checkoutId: string,
  paymentInformationId: string,
): Promise<PaymentInformationResponse> => {
  console.log(
    'getPaymentInformation',
    merchantId,
    commerceCaseId,
    checkoutId,
    paymentInformationId,
  );
  return Promise.resolve({});
};
