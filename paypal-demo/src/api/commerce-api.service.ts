/** Typed PAYONE HTTP operations through the configured merchant backend. */
import type {
  CreateCommerceCaseRequest,
  CreatePaymentIntentResponse,
  PaymentIntentRequest,
  PaymentIntentResponse,
} from 'pcp-client-javascript-sdk';

interface PaymentState {
  id?: string;
  status?: string;
  paymentOutput?: { redirectPaymentMethodSpecificOutput?: { payPalTransactionId?: string } };
}

export interface CreateResponse {
  commerceCaseId?: string;
  checkout?: {
    checkoutId?: string;
    errorResponse?: unknown;
    paymentResponse?: {
      payment?: PaymentState;
      merchantAction?: { redirectData?: { redirectURL?: string } };
    };
  };
}

export interface CheckoutResponse {
  statusOutput?: { paymentStatus?: string };
  paymentExecutions?: { paymentId?: string; events?: { paymentStatus?: string }[] }[];
}

export interface CompleteResponse {
  payment?: PaymentState;
  errorResponse?: unknown;
}

// The client SDK does not yet declare the PayPal complete-order request.
export interface PayPalCompleteOrderRequest {
  completePaymentMethodSpecificInput: {
    paymentProduct840SpecificInput: { javaScriptSdkFlow: true; action: 'CONFIRM_ORDER_STATUS' };
  };
}

export class CommerceApiError extends Error {
  constructor(
    public readonly kind: 'http' | 'network' | 'invalid-response',
    public readonly method: 'GET' | 'POST',
    public readonly status?: number,
    public readonly details?: unknown,
  ) {
    super(
      `Commerce API ${method}: ${kind === 'http' ? `HTTP ${status}` : kind}.` +
        (method === 'POST'
          ? ' Payment outcome may be unknown; reconcile before retrying.'
          : ' Could not read payment status.'),
    );
    this.name = 'CommerceApiError';
  }
}

export class CommerceApiService {
  public readonly baseUrl: string;

  constructor(baseUrl: string) {
    const url = new URL(baseUrl);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      throw new Error(
        'backendUrl must be an HTTP(S) base URL without credentials, query or fragment.',
      );
    }
    if (!url.pathname.endsWith('/')) {
      url.pathname += '/';
    }
    this.baseUrl = url.href;
  }

  createCommerceCase(body: CreateCommerceCaseRequest) {
    return this.request<CreateResponse>('commerce-cases', body);
  }

  getCheckout(commerceCaseId: string, checkoutId: string) {
    return this.request<CheckoutResponse>(
      `commerce-cases/${encodeURIComponent(commerceCaseId)}/checkouts/${encodeURIComponent(checkoutId)}`,
    );
  }

  completeOrder(commerceCaseId: string, checkoutId: string, body: PayPalCompleteOrderRequest) {
    return this.request<CompleteResponse>(
      `commerce-cases/${encodeURIComponent(commerceCaseId)}/checkouts/${encodeURIComponent(checkoutId)}/complete-order`,
      body,
    );
  }

  createPaymentIntent(body: PaymentIntentRequest) {
    return this.request<CreatePaymentIntentResponse>('payment-intents', body);
  }

  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntentResponse> {
    // Only this GET retries temporary/incomplete responses, within one two-second window.
    const deadline = Date.now() + 2000;
    while (true) {
      try {
        const response = await this.request<PaymentIntentResponse>(
          `payment-intents/${encodeURIComponent(paymentIntentId)}`,
          undefined,
          Math.max(1, deadline - Date.now()),
        );
        if (
          response.body.redirectPaymentMethodSpecificOutput?.paymentProduct840SpecificOutput
            ?.shippingAddress
        ) {
          return response.body;
        }
      } catch (error) {
        if (
          !(error instanceof CommerceApiError) ||
          (error.kind !== 'network' && ![404, 409, 503].includes(error.status ?? 0))
        ) {
          throw error;
        }
      }
      if (Date.now() + 200 >= deadline) {
        throw new Error(
          'PayPal intent data is not ready after the two-second retry window. Reload to check the same intent; do not create another one.',
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  private async request<T>(
    path: string,
    body?: unknown,
    timeout = 20000,
  ): Promise<{ body: T; status: number }> {
    const method = body === undefined ? 'GET' : 'POST';
    let response: Response;
    try {
      response = await fetch(new URL(path, this.baseUrl), {
        method,
        credentials: 'omit',
        headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeout),
      });
    } catch {
      throw new CommerceApiError('network', method);
    }
    let parsed: T;
    try {
      parsed = await response.json();
    } catch {
      throw new CommerceApiError(
        response.ok ? 'invalid-response' : 'http',
        method,
        response.status,
      );
    }
    if (!response.ok) {
      throw new CommerceApiError('http', method, response.status, parsed);
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new CommerceApiError('invalid-response', method, response.status);
    }
    return { body: parsed, status: response.status };
  }
}
