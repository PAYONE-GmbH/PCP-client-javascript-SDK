import {
  OrderType,
  type AddressPersonal,
  type CreateCommerceCaseRequest,
  type CreatePaymentIntentResponse,
  type Customer,
  type ExpressPaymentReference,
  type ExpressPaymentResult,
  type PaymentIntentRequest,
  type PaymentIntentResponse,
  type PaymentMethodSpecificInput,
} from 'pcp-client-javascript-sdk';
import { quote, shoppingCart } from './pricing';

export interface DemoConfig {
  backendUrl: string;
  returnUrl: string;
  shippingOptionId: string;
}

export function backendConfig(href: string, env: Record<string, string | undefined>): DemoConfig {
  const page = new URL(href);
  const contextId = page.searchParams.get('context');
  const storageKey = (id: string) => `paypal:return:${page.origin}${page.pathname}:${id}`;
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
  const shippingOptionId =
    page.searchParams.get('shipping') ??
    restored?.shippingOptionId ??
    env.VITE_SHIPPING_OPTION ??
    'standard';
  quote('DE', shippingOptionId);
  const id = contextId ?? crypto.randomUUID();
  page.search = '';
  page.searchParams.set('returned', '1');
  page.searchParams.set('context', id);
  page.hash = '';
  if (page.href.length > 200)
    throw new Error(
      'The payment return URL exceeds 200 characters. Serve the demo at a shorter origin/path.',
    );
  const config = { backendUrl: backend.href, shippingOptionId };
  sessionStorage.setItem(storageKey(id), JSON.stringify(config));
  return { ...config, returnUrl: page.href };
}

interface PaymentState {
  id?: string;
  status?: string;
  statusOutput?: { isAuthorized?: boolean; statusCategory?: string };
  paymentOutput?: {
    redirectPaymentMethodSpecificOutput?: { payPalTransactionId?: string };
  };
}
interface CreateResponse {
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
interface CheckoutResponse {
  statusOutput?: { paymentStatus?: string };
  paymentExecutions?: { paymentId?: string; events?: { paymentStatus?: string }[] }[];
}
interface CompleteResponse {
  payment?: PaymentState;
  errorResponse?: unknown;
}

const failedStatuses = ['REJECTED', 'REJECTED_CAPTURE', 'CANCELLED'];

/** Authorization alone remains pending until capture, including the SDK's authorize mode. */
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
    return {
      status: 'failed',
      code: 'PAYMENT_FAILED',
      message:
        'PAYONE did not complete the payment. Reconcile the created checkout before another attempt.',
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
  // PAYMENT_COMPLETED is the checkout-level authority. Old CAPTURED events alone could precede a refund.
  const events = body.paymentExecutions?.flatMap((execution) => execution.events ?? []) ?? [];
  if (events.length && failedStatuses.includes(events[events.length - 1].paymentStatus ?? '')) {
    return { status: 'failed', code: 'PAYMENT_FAILED', message: 'Payment rejected or cancelled.' };
  }
  return { ...reference, status: 'pending' };
}

interface Attempt {
  phase: 'submitting' | 'created';
  reference?: ExpressPaymentReference;
  sdkOrderId?: string;
  completion?: 'submitting' | 'completed';
}

export interface PayPalSdkOrder extends ExpressPaymentReference {
  commerceCaseId: string;
  checkoutId: string;
  orderId: string;
}

/** A thin client for the EXISTING OpenAPI. It never adds backend routes or automatic POST retries. */
export class CommerceBackend {
  public readonly storageKey: string;
  constructor(public readonly config: DemoConfig) {
    this.storageKey = `paypal:order:${config.backendUrl}`;
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
    const response = await this.createCommerceCase(input, customer, address, optionId);
    return mapCreated(response.body, response.status);
  }

  public async createSdkOrder(
    input: PaymentMethodSpecificInput,
    customer: Customer,
    address: AddressPersonal,
    optionId: string,
  ): Promise<PayPalSdkOrder> {
    const response = await this.createCommerceCase(input, customer, address, optionId);
    const result = mapCreated(response.body, response.status);
    if (result.status === 'failed') throw new Error(result.message);
    const commerceCaseId = response.body.commerceCaseId;
    const checkoutId = response.body.checkout?.checkoutId;
    const payment = response.body.checkout?.paymentResponse?.payment;
    const orderId =
      payment?.paymentOutput?.redirectPaymentMethodSpecificOutput?.payPalTransactionId;
    if (!commerceCaseId || !checkoutId || !orderId)
      throw new Error(
        'PAYONE SDK response lacks checkout IDs or payPalTransactionId. Reconcile the saved attempt.',
      );
    const order = { commerceCaseId, checkoutId, paymentId: payment?.id, orderId };
    sessionStorage.setItem(
      this.storageKey,
      JSON.stringify({
        phase: 'created',
        reference: { commerceCaseId, checkoutId, paymentId: payment?.id },
        sdkOrderId: orderId,
      }),
    );
    return order;
  }

  private completion?: Promise<ExpressPaymentResult>;

  /** Confirm PAYONE status, never capture/authorize through PayPal's browser actions. */
  public completeSdkOrder(order: PayPalSdkOrder): Promise<ExpressPaymentResult> {
    const attempt = this.getAttempt();
    if (
      attempt?.sdkOrderId !== order.orderId ||
      attempt.reference?.commerceCaseId !== order.commerceCaseId ||
      attempt.reference?.checkoutId !== order.checkoutId
    )
      return Promise.reject(new Error('PayPal completion correlation mismatch.'));
    if (this.completion) return this.completion;
    if (attempt.completion)
      return Promise.reject(
        new Error('Completion already started. Check checkout status; do not repeat the POST.'),
      );
    sessionStorage.setItem(
      this.storageKey,
      JSON.stringify({ ...attempt, completion: 'submitting' }),
    );
    const path = `commerce-cases/${encodeURIComponent(order.commerceCaseId)}/checkouts/${encodeURIComponent(order.checkoutId)}/complete-order`;
    this.completion = this.request<CompleteResponse>(path, {
      completePaymentMethodSpecificInput: {
        paymentProduct840SpecificInput: { javaScriptSdkFlow: true, action: 'CONFIRM_ORDER_STATUS' },
      },
    }).then((response) => {
      sessionStorage.setItem(
        this.storageKey,
        JSON.stringify({ ...attempt, completion: 'completed' }),
      );
      const completionResult = mapCreated(
        {
          commerceCaseId: order.commerceCaseId,
          checkout: {
            checkoutId: order.checkoutId,
            errorResponse: response.body.errorResponse,
            paymentResponse: { payment: response.body.payment },
          },
        },
        response.status,
      );
      if (completionResult.status === 'failed') return completionResult;
      return this.status(order);
    });
    return this.completion;
  }

  private async createCommerceCase(
    input: PaymentMethodSpecificInput,
    customer: Customer,
    address: AddressPersonal,
    optionId: string,
  ): Promise<{ body: CreateResponse; status: number }> {
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
    const reference = {
      commerceCaseId: response.body.commerceCaseId,
      checkoutId: response.body.checkout?.checkoutId,
      paymentId: response.body.checkout?.paymentResponse?.payment?.id,
    };
    sessionStorage.setItem(this.storageKey, JSON.stringify({ phase: 'created', reference }));
    return response;
  }

  public async status(reference: ExpressPaymentReference): Promise<ExpressPaymentResult> {
    if (!reference.commerceCaseId || !reference.checkoutId)
      throw new Error('Missing checkout IDs. Reconcile the uncertain attempt in the backend.');
    const path = `commerce-cases/${encodeURIComponent(reference.commerceCaseId)}/checkouts/${encodeURIComponent(reference.checkoutId)}`;
    return mapCheckout((await this.request<CheckoutResponse>(path)).body, reference);
  }

  public async createIntent(): Promise<{
    paymentIntentId: string;
    paymentId: string;
    redirectUrl: string;
  }> {
    if (this.getAttempt() || sessionStorage.getItem(`${this.storageKey}:intent-attempt`))
      throw new Error(
        'A PayPal attempt already exists. Reconcile it before creating another intent.',
      );
    const request: PaymentIntentRequest = {
      amountOfMoney: {
        amount: quote('DE', this.config.shippingOptionId).total,
        currencyCode: 'EUR',
      },
      references: { merchantReference: crypto.randomUUID().replace(/-/g, '').slice(0, 20) },
      shoppingCart: shoppingCart(this.config.shippingOptionId),
      paymentMethodSpecificInput: {
        redirectPaymentMethodSpecificInput: {
          paymentProductId: 840,
          requiresApproval: false,
          redirectionData: { returnUrl: this.config.returnUrl },
          paymentProduct840SpecificInput: {
            addressSelectionAtPayPal: true,
            javaScriptSdkFlow: false,
          },
        },
      },
    };
    sessionStorage.setItem(`${this.storageKey}:intent-attempt`, 'submitting');
    const response = (await this.request<CreatePaymentIntentResponse>('payment-intents', request))
      .body.paymentIntentOutput;
    const redirectUrl = response?.redirectPaymentMethodSpecificOutput?.redirectData?.redirectURL;
    if (!response?.paymentIntentId || !response.paymentId || !redirectUrl)
      throw new Error('PaymentIntent response lacks IDs or redirectURL.');
    sessionStorage.setItem(`${this.storageKey}:intent-attempt`, 'created');
    return {
      paymentIntentId: response.paymentIntentId,
      paymentId: response.paymentId,
      redirectUrl,
    };
  }

  public async loadIntent(paymentIntentId: string): Promise<PaymentIntentResponse> {
    // Only this read is retried, within a single two-second deadline.
    const deadline = Date.now() + 2000;
    while (true) {
      let response: Response;
      try {
        response = await fetch(
          this.endpoint(`payment-intents/${encodeURIComponent(paymentIntentId)}`),
          {
            credentials: 'omit',
            signal: AbortSignal.timeout(Math.max(1, deadline - Date.now())),
          },
        );
      } catch (error) {
        if (Date.now() + 200 >= deadline) throw error;
        await new Promise((resolve) => setTimeout(resolve, 200));
        continue;
      }
      if (response.ok) {
        const intent = (await response.json()) as PaymentIntentResponse;
        if (
          intent.redirectPaymentMethodSpecificOutput?.paymentProduct840SpecificOutput
            ?.shippingAddress
        )
          return intent;
      } else if (![404, 409, 503].includes(response.status)) {
        throw new Error(`PaymentIntent HTTP ${response.status}`);
      }
      if (Date.now() + 200 >= deadline)
        throw new Error(
          'PayPal intent data is not ready after the two-second retry window. Reload to check the same intent; do not create another one.',
        );
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
}
