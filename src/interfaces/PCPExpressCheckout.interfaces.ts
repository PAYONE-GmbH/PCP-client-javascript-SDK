/** Provider approval is not proof of a completed payment. The backend determines this result. */
export type ExpressPaymentResult =
  | ({ status: 'succeeded' } & ExpressPaymentReference)
  | ({ status: 'requires-action'; redirectUrl: string } & ExpressPaymentReference)
  | ({ status: 'pending' } & ExpressPaymentReference)
  | { status: 'failed'; code: string; message: string };

export interface ExpressPaymentReference {
  commerceCaseId?: string;
  checkoutId?: string;
  paymentId?: string;
}
