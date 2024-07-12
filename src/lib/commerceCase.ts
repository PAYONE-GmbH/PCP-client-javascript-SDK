/**
 * Resource for the operations on Commerce Cases.
 */
import {
  CommerceCaseResponse,
  CreateCommerceCaseRequest,
  CreateCommerceCaseResponse,
  GetCommerceCasesQueryParams,
  PatchCommerceCaseRequest,
} from '../interfaces';

/**
 * Create a Commerce Case
 * @description This method can be used to create a Commerce Case in combination with a Checkout and an Order. A Commerce Case is a container for multiple Checkouts and can be directly linked to one customer. The Order can either be directly executed or the paymentMethodSpecificInput can also be stored for a later execution over the OrderManagementCheckoutActions or Payment Execution method.
 * @param {string} merchantId
 * @param {CreateCommerceCaseRequest} body
 * @returns {Promise<CreateCommerceCaseResponse>}
 */
export const createCommerceCase = (
  merchantId: string,
  body: CreateCommerceCaseRequest,
): Promise<CreateCommerceCaseResponse> => {
  console.log('createCommerceCase', merchantId, body);
  return Promise.resolve({});
};

/**
 * Get Commerce Case Details
 * @description This method can be used to get a specific Commerce Case and all linked Checkouts.
 * @param {string} merchantId
 * @param {string} commerceCaseId
 * @returns {Promise<CommerceCaseResponse>}
 */
export const getCommerceCase = (
  merchantId: string,
  commerceCaseId: string,
): Promise<CommerceCaseResponse> => {
  console.log('getCommerceCase', merchantId, commerceCaseId);
  return Promise.resolve({});
};

/**
 * Modify an existing Commerce Case
 * @description This method can be used to update or modify the customer object of a Commerce Case.
 * @param {string} merchantId
 * @param {string} commerceCaseId
 * @param {PatchCommerceCaseRequest} body
 * @returns {Promise<CommerceCaseResponse>}
 */
export const patchCommerceCase = (
  merchantId: string,
  commerceCaseId: string,
  body: PatchCommerceCaseRequest,
): Promise<CommerceCaseResponse> => {
  console.log('patchCommerceCase', merchantId, commerceCaseId, body);
  return Promise.resolve({});
};

/**
 * Get a list of Commerce Cases based on Search Parameters
 * @description This method will provide a list of Commerce Cases based on the provided criteria. Not all parameters are required to be set. Results will be returned in descending creation time per default.
 * @param {string} merchantId
 * @param {GetCommerceCasesQueryParams} query
 * @returns {Promise<CommerceCaseResponse[]>}
 */
export const getCommerceCases = (
  merchantId: string,
  query: GetCommerceCasesQueryParams,
): Promise<CommerceCaseResponse[]> => {
  console.log('getCommerceCases', merchantId, query);
  return Promise.resolve([]);
};
