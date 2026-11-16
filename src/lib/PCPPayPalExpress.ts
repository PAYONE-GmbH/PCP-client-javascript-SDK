import type { ExpressPaymentResult } from '../interfaces/PCPExpressCheckout.interfaces.js';
import type {
  PayPalExpressContext,
  PCPPayPalExpressConfig,
} from '../interfaces/PCPPayPalExpress.interfaces.js';

/** PAYONE PaymentIntent redirect flow (not the PayPal JavaScript SDK popup flow). */
export class PCPPayPalExpress<TIntent> {
  private context?: PayPalExpressContext;
  private intent?: TIntent;
  private busy = false;
  private confirmation?: Promise<ExpressPaymentResult>;

  private constructor(private readonly config: PCPPayPalExpressConfig<TIntent>) {}

  public static create<TIntent>(
    config: PCPPayPalExpressConfig<TIntent>,
  ): PCPPayPalExpress<TIntent> {
    return new PCPPayPalExpress(config);
  }

  private save(context: PayPalExpressContext): void {
    this.config.contextChangedCallback({ ...context });
    this.context = { ...context };
  }

  private navigate(url: string): void {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:')
      throw new Error('Invalid redirect URL.');
    (this.config.navigate ?? ((target) => window.location.assign(target)))(parsed.href);
  }

  public async start(): Promise<void> {
    if (this.busy || this.context) throw new Error('A PayPal Express attempt already exists.');
    this.busy = true;
    try {
      const created = await this.config.createIntent();
      this.save({
        paymentIntentId: created.paymentIntentId,
        paymentId: created.paymentId,
        phase: 'redirected',
      });
      this.navigate(created.redirectUrl);
    } catch (error) {
      this.config.errorCallback?.(error as Error);
      throw error;
    } finally {
      this.busy = false;
    }
  }

  /** Restore IDs after return. A returned URL alone is never interpreted as approval or payment success. */
  public async resume(context: PayPalExpressContext): Promise<TIntent> {
    if (this.busy || this.confirmation) throw new Error('PayPal Express is busy.');
    this.busy = true;
    try {
      this.intent = undefined;
      this.save(context);
      this.intent = await this.config.loadIntent({ ...context });
      if (context.phase === 'redirected') this.save({ ...context, phase: 'review' });
      return this.intent;
    } catch (error) {
      this.config.errorCallback?.(error as Error);
      throw error;
    } finally {
      this.busy = false;
    }
  }

  public confirm(): Promise<ExpressPaymentResult> {
    if (this.confirmation) return this.confirmation;
    if (this.context?.phase === 'submitted' && this.context.result)
      return Promise.resolve(this.context.result);
    if (this.busy || this.context?.phase !== 'review' || this.intent === undefined) {
      return Promise.reject(
        new Error(
          'Resume and review the intent first. Uncertain submissions must be reconciled, not retried.',
        ),
      );
    }
    const context = { ...this.context, phase: 'confirming' as const };
    this.save(context);
    this.confirmation = (async () => {
      try {
        const result = await this.config.confirmPayment(this.intent!, context);
        this.save({ ...context, phase: 'submitted', result });
        this.config.resultCallback?.(result);
        if (result.status === 'requires-action') this.navigate(result.redirectUrl);
        return result;
      } catch (error) {
        this.config.errorCallback?.(error as Error);
        throw error;
      }
    })();
    return this.confirmation;
  }

  /** Explicit local cancellation before submitting. Provider return signals require API verification. */
  public cancel(): void {
    if (this.busy || this.context?.phase === 'confirming' || this.context?.phase === 'submitted') {
      throw new Error('A submitted payment must be reconciled before starting another attempt.');
    }
    this.config.contextChangedCallback(null);
    this.context = undefined;
    this.intent = undefined;
    this.config.cancelCallback?.();
  }
}
