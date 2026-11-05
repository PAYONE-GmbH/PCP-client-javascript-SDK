import {
  OrderType,
  type AddressPersonal,
  type CreateCommerceCaseRequest,
  type Customer,
  type ExpressPaymentReference,
  type ExpressPaymentResult,
  type PaymentMethodSpecificInput,
} from 'pcp-client-javascript-sdk';
import { quote, shoppingCart } from './pricing';

export interface DemoConfig {
  backendUrl: string;
  returnUrl: string;
}

export function backendConfig(href: string, env: Record<string, string | undefined>): DemoConfig {
  const page = new URL(href);
  const contextId = page.searchParams.get('context');
  const storageKey = (id: string) => `google:return:${page.origin}${page.pathname}:${id}`;
  const saved = contextId ? sessionStorage.getItem(storageKey(contextId)) : null;
  if (contextId && !saved)
    throw new Error(
      'Return configuration is missing. Reopen the original demo URL in the same tab and reconcile the existing payment.',
    );
  const restored = saved ? (JSON.parse(saved) as Omit<DemoConfig, 'returnUrl'>) : undefined;
  const base =
    page.searchParams.get('backendUrl') ?? restored?.backendUrl ?? env.VITE_BACKEND_BASE_URL;
  if (!base) throw new Error('Set backendUrl in the URL or VITE_BACKEND_BASE_URL.');
  const backend = new URL(base);
  if (
    !['http:', 'https:'].includes(backend.protocol) ||
    backend.username ||
    backend.password ||
    backend.search ||
    backend.hash
  ) {
    throw new Error(
      'backendUrl must be an absolute HTTP(S) base URL without credentials, query or fragment.',
    );
  }
  if (!backend.pathname.endsWith('/')) backend.pathname += '/';
  const id = contextId ?? crypto.randomUUID();
  page.search = '';
  page.searchParams.set('returned', '1');
  page.searchParams.set('context', id);
  page.hash = '';
  if (page.href.length > 200)
    throw new Error(
      'The payment return URL exceeds 200 characters. Serve the demo at a shorter origin/path.',
    );
  const config = { backendUrl: backend.href };
  sessionStorage.setItem(storageKey(id), JSON.stringify(config));
  return { ...config, returnUrl: page.href };
}

interface PaymentState {
  id?: string;
  status?: string;
  statusOutput?: { isAuthorized?: boolean; statusCategory?: string };
}
interface CreateResponse {
  commerceCaseId?: string;
  checkout?: {
    checkoutId?: string;
    errorResponse?: {
      errorId?: string;
      errors?: { errorCode?: string; id?: string }[];
    };
    paymentResponse?: {
      payment?: PaymentState;
      merchantAction?: { redirectData?: { redirectURL?: string } };
    };
  };
}
interface CheckoutResponse {
  statusOutput?: { paymentStatus?: string };
  paymentExecutions?: { paymentId?: string; events?: { paymentStatus?: string }[] }[];
}

const failedStatuses = ['REJECTED', 'REJECTED_CAPTURE', 'CANCELLED'];

/** Demo uses SALE: authorization alone remains pending until capture. */
export function mapCreated(body: CreateResponse, httpStatus: number): ExpressPaymentResult {
  const checkout = body.checkout;
  const payment = checkout?.paymentResponse?.payment;
  const reference = {
    commerceCaseId: body.commerceCaseId,
    checkoutId: checkout?.checkoutId,
    paymentId: payment?.id,
  };
  if (
    httpStatus === 202 ||
    checkout?.errorResponse ||
    failedStatuses.includes(payment?.status ?? '')
  ) {
    const configurationError = checkout?.errorResponse?.errors?.some(
      (error) => error.errorCode === '1201' || error.id === 'PAYMENT_PRODUCT_CONFIGURATION_ERROR',
    );
    return {
      status: 'failed',
      code: configurationError ? 'PAYMENT_PRODUCT_CONFIGURATION_ERROR' : 'PAYMENT_FAILED',
      message: configurationError
        ? 'PAYONE rejected Google Pay: PAYMENT_PRODUCT_CONFIGURATION_ERROR (1201). Check product 320 and the merchant/environment configuration with PAYONE. Reconcile the created checkout before another attempt.'
        : 'PAYONE did not complete the payment. Reconcile the created checkout before another attempt.',
    };
  }
  const redirectUrl = checkout?.paymentResponse?.merchantAction?.redirectData?.redirectURL;
  if (redirectUrl) return { ...reference, status: 'requires-action', redirectUrl };
  if (payment?.status === 'CAPTURED') return { ...reference, status: 'succeeded' };
  return { ...reference, status: 'pending' };
}

export function mapCheckout(
  body: CheckoutResponse,
  reference: ExpressPaymentReference,
): ExpressPaymentResult {
  if (body.statusOutput?.paymentStatus === 'PAYMENT_COMPLETED')
    return { ...reference, status: 'succeeded' };
  // Old CAPTURED events alone could precede a refund; checkout status is authoritative.
  const events = body.paymentExecutions?.flatMap((execution) => execution.events ?? []) ?? [];
  if (events.length && failedStatuses.includes(events[events.length - 1].paymentStatus ?? '')) {
    return { status: 'failed', code: 'PAYMENT_FAILED', message: 'Payment rejected or cancelled.' };
  }
  return { ...reference, status: 'pending' };
}

interface Attempt {
  phase: 'submitting' | 'created';
  reference?: ExpressPaymentReference;
}

/** Shared Standard/Express adapter for a merchant Commerce backend; no automatic POST retries. */
export class CommerceBackend {
  public readonly storageKey: string;
  constructor(public readonly config: DemoConfig) {
    this.storageKey = `google:order:${config.backendUrl}`;
  }

  private endpoint(path: string): URL {
    return new URL(path, this.config.backendUrl);
  }

  public async request<T>(path: string, body?: unknown): Promise<{ body: T; status: number }> {
    const response = await fetch(this.endpoint(path), {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'omit',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok)
      throw new Error(
        `Commerce API HTTP ${response.status}. Do not repeat an uncertain POST; reconcile first.`,
      );
    return { body: (await response.json()) as T, status: response.status };
  }

  public getAttempt(): Attempt | null {
    return JSON.parse(sessionStorage.getItem(this.storageKey) ?? 'null') as Attempt | null;
  }

  public async createOrder(
    input: PaymentMethodSpecificInput,
    customer: Customer,
    address: AddressPersonal,
    optionId: string,
  ): Promise<ExpressPaymentResult> {
    if (this.getAttempt())
      throw new Error('An order attempt already exists. Check its status before another payment.');
    if (
      address.countryCode !== 'DE' ||
      !address.city ||
      !address.zip ||
      !address.street ||
      !address.name?.surname
    ) {
      throw new Error('A complete final German shipping address is required.');
    }
    const price = quote(address.countryCode, optionId);
    const merchantReference = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
    const request: CreateCommerceCaseRequest = {
      customer,
      checkout: {
        amountOfMoney: { amount: price.total, currencyCode: 'EUR' },
        references: { merchantReference },
        shipping: { address },
        shoppingCart: shoppingCart(optionId),
        autoExecuteOrder: true,
        orderRequest: {
          orderType: OrderType.FULL,
          orderReferences: { merchantReference },
          paymentMethodSpecificInput: input,
        },
      },
    };
    sessionStorage.setItem(this.storageKey, JSON.stringify({ phase: 'submitting' }));
    const response = await this.request<CreateResponse>('commerce-cases', request);
    const result = mapCreated(response.body, response.status);
    const reference = {
      commerceCaseId: response.body.commerceCaseId,
      checkoutId: response.body.checkout?.checkoutId,
      paymentId: response.body.checkout?.paymentResponse?.payment?.id,
    };
    sessionStorage.setItem(this.storageKey, JSON.stringify({ phase: 'created', reference }));
    return result;
  }

  public async status(reference: ExpressPaymentReference): Promise<ExpressPaymentResult> {
    if (!reference.commerceCaseId || !reference.checkoutId)
      throw new Error('Missing checkout IDs. Reconcile the uncertain attempt in the backend.');
    const path = `commerce-cases/${encodeURIComponent(reference.commerceCaseId)}/checkouts/${encodeURIComponent(reference.checkoutId)}`;
    return mapCheckout((await this.request<CheckoutResponse>(path)).body, reference);
  }
}
