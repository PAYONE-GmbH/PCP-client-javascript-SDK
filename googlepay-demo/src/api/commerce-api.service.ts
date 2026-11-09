/** HTTP client for your merchant server. No Google, catalog, storage or UI dependencies.
 * Adapt credentials/headers to the server contract. POSTs are never automatically retried.
 */
import type { CreateCommerceCaseRequest } from 'pcp-client-javascript-sdk';

export interface CreateResponse {
  commerceCaseId?: string;
  checkout?: {
    checkoutId?: string;
    errorResponse?: { errorId?: string; errors?: { errorCode?: string; id?: string }[] };
    paymentResponse?: {
      payment?: {
        id?: string;
        status?: string;
        statusOutput?: { isAuthorized?: boolean; statusCategory?: string };
      };
      merchantAction?: { redirectData?: { redirectURL?: string } };
    };
  };
}

export interface CheckoutResponse {
  statusOutput?: { paymentStatus?: string };
  paymentExecutions?: { paymentId?: string; events?: { paymentStatus?: string }[] }[];
}

export interface ApiResponse<T> {
  body: T;
  status: number;
}

export interface CommerceApi {
  createCommerceCase(request: CreateCommerceCaseRequest): Promise<ApiResponse<CreateResponse>>;
  getCheckout(commerceCaseId: string, checkoutId: string): Promise<ApiResponse<CheckoutResponse>>;
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
          : ' Could not read checkout status.'),
    );
    this.name = 'CommerceApiError';
  }
}

export class CommerceApiService implements CommerceApi {
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

  createCommerceCase(request: CreateCommerceCaseRequest): Promise<ApiResponse<CreateResponse>> {
    return this.request('commerce-cases', request);
  }

  getCheckout(commerceCaseId: string, checkoutId: string): Promise<ApiResponse<CheckoutResponse>> {
    return this.request(
      `commerce-cases/${encodeURIComponent(commerceCaseId)}/checkouts/${encodeURIComponent(checkoutId)}`,
    );
  }

  private async request<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    const method = body === undefined ? 'GET' : 'POST';
    let response: Response;
    try {
      response = await fetch(new URL(path, this.baseUrl), {
        method,
        credentials: 'omit',
        headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
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
