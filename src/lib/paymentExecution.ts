/**
 * Resource for operations on Payment Executions. Requires PAYMENT_EXECUTION as allowedPaymentActions.
 */
import {
  CancelPaymentRequest,
  CancelPaymentResponse,
  CapturePaymentRequest,
  CapturePaymentResponse,
  CompletePaymentRequest,
  CompletePaymentResponse,
  CreatePaymentResponse,
  PaymentExecutionRequest,
  RefundPaymentResponse,
  RefundRequest,
} from '../interfaces';

/**
 * Create a Payment
 * @description This method can be used to create a payment for a specific payment method. The amount of the payment cannot exceed the overall Checkout amount. OrderManagementActions will be impossible after using a PaymentExecution method.
 * @param {string} merchantId
 * @param {string} commerceCaseId
 * @param {string} checkoutId
 * @param {PaymentExecutionRequest} body
 * @returns {Promise<CreatePaymentResponse>}
 */
export const createPayment = (
  merchantId: string,
  commerceCaseId: string,
  checkoutId: string,
  body: PaymentExecutionRequest,
): Promise<CreatePaymentResponse> => {
  console.log('createPayment', merchantId, commerceCaseId, checkoutId, body);
  return Promise.resolve({});
};

/**
 * Capture a Payment
 * @description This method can be used to capture authorized amounts of a payment. The Capture can only be done for Checkouts with status COMPLETED, BILLED or CHARGEBACKED. OrderManagementActions will be impossible after using a PaymentExecution method. It is possible to perform multiple partial captures by providing an amount that is lower than the total authorized amount.
 *
 * The cancellationReason is mandatory for BNPL payment methods (paymentProductId 3390, 3391 and 3392) if isFinal is set to true and the amount of the Capture is lower than the authorized amount. For other payment methods the cancellationReason is not mandatory in this case but can be used for reporting and reconciliation purposes.
 * @param {string} merchantId
 * @param {string} commerceCaseId
 * @param {string} checkoutId
 * @param {string} paymentExecutionId
 * @param {CapturePaymentRequest} body
 * @returns {Promise<CapturePaymentResponse>}
 */
export const capturePayment = (
  merchantId: string,
  commerceCaseId: string,
  checkoutId: string,
  paymentExecutionId: string,
  body: CapturePaymentRequest,
): Promise<CapturePaymentResponse> => {
  console.log(
    'capturePayment',
    merchantId,
    commerceCaseId,
    checkoutId,
    paymentExecutionId,
    body,
  );
  return Promise.resolve({});
};

/**
 * Cancel a Payment
 * @description This method can be used to reverse the payment associated with this Checkout. The Cancel is only possible for the entire amount of the payment and not partial payments. OrderManagementActions will be impossible after using a PaymentExecution method.
 *
 * In the light of card payments, reversing an authorization that is not needed will prevent you from having to pay a fee/penalty for unused authorization requests. Whilst scheme regulations require that acquirers and PSPs support authorization reversals, there are no rules towards issuers mandating them to process the reversal advice. Therefore, there is no guarantee the authorization hold is released. The authorization reversal can only be performed by the card issuer, and under no circumstances will we be responsible for performing the authorization reversal.
 *
 * The cancellationReason is mandatory for BNPL payment methods (paymentProductId 3390, 3391 and 3392). For other payment methods the cancellationReason is not mandatory but can be used for reporting and reconciliation purposes.
 * @param {string} merchantId
 * @param {string} commerceCaseId
 * @param {string} checkoutId
 * @param {string} paymentExecutionId
 * @param {CancelPaymentRequest} body
 * @returns {Promise<CancelPaymentResponse>}
 */
export const cancelPayment = (
  merchantId: string,
  commerceCaseId: string,
  checkoutId: string,
  paymentExecutionId: string,
  body: CancelPaymentRequest,
): Promise<CancelPaymentResponse> => {
  console.log(
    'cancelPayment',
    merchantId,
    commerceCaseId,
    checkoutId,
    paymentExecutionId,
    body,
  );
  return Promise.resolve({});
};

/**
 * Refund a Payment
 * @description This method can be used to refund a payment for the associated Checkout. The Refund can only be done for Checkouts with status BILLED or CHARGEBACKED. OrderManagementActions will be impossible after using a PaymentExecution method.
 * @param merchantId
 * @param commerceCaseId
 * @param checkoutId
 * @param paymentExecutionId
 * @param body
 * @returns
 */
export const refundPayment = (
  merchantId: string,
  commerceCaseId: string,
  checkoutId: string,
  paymentExecutionId: string,
  body: RefundRequest,
): Promise<RefundPaymentResponse> => {
  console.log(
    'refundPayment',
    merchantId,
    commerceCaseId,
    checkoutId,
    paymentExecutionId,
    body,
  );
  return Promise.resolve({});
};

/**
 * Complete a Payment
 * @description For PAYONE Secured Installment (paymentProductId 3391) a two-step process is required. The first step is creating a Payment, the second step is completing it by calling this API method. OrderManagementActions will be impossible after using a PaymentExecution method.
 * @param {string} merchantId
 * @param {string} commerceCaseId
 * @param {string} checkoutId
 * @param {string} paymentExecutionId
 * @param {CompletePaymentRequest} body
 * @returns {Promise<CompletePaymentResponse>}
 */
export const completePayment = (
  merchantId: string,
  commerceCaseId: string,
  checkoutId: string,
  paymentExecutionId: string,
  body: CompletePaymentRequest,
): Promise<CompletePaymentResponse> => {
  console.log(
    'completePayment',
    merchantId,
    commerceCaseId,
    checkoutId,
    paymentExecutionId,
    body,
  );
  return Promise.resolve({});
};
