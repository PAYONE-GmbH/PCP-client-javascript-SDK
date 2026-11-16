import type { Config } from '../interfaces/index.js';
import { loadTokenizerResource, removeTokenizerResource } from './loadTokenizerResource.js';

interface HostedTokenizationSdk {
  init(): Promise<void>;
  getPaymentPage(config: object, callback?: Config['paymentPageCallback']): void | Promise<void>;
  submitForm(
    success: Config['tokenizationSuccessCallback'],
    failure: (status: number, error: string | { error?: string; [key: string]: unknown }) => void,
  ): void;
}

declare global {
  interface Window {
    HostedTokenizationSdk?: HostedTokenizationSdk;
  }
}

const SDK_INTEGRITY = 'sha384-LyveXKhhHLdY1+hrDFdGnVt+rH6LRqqn4MYhBzdSnOfYgDhKJk/6aapnGqvxSZLF';

export class PCPCreditCardTokenizer {
  private static readonly active = new WeakMap<Document, PCPCreditCardTokenizer>();
  private readonly submitButtonElement: HTMLElement;
  private destroyed = false;
  private submitting = false;

  public static async create(config: Config) {
    const instance = new PCPCreditCardTokenizer(config);
    try {
      await instance.initialize();
    } catch (error) {
      instance.destroy();
      throw error;
    }
    return instance;
  }

  private constructor(private readonly config: Config) {
    const button =
      config.submitButton.element ??
      (config.submitButton.selector ? document.querySelector(config.submitButton.selector) : null);
    if (!button) {
      throw new Error('Submit Button not present. Please provide a valid selector or element.');
    }
    this.submitButtonElement = button as HTMLElement;
  }

  private async initialize() {
    const mode = this.config.mode ?? 'test';
    if (mode !== 'test' && mode !== 'live') throw new Error('Invalid tokenization mode.');
    if (!this.config.token.trim()) throw new Error('A tokenization JWT is required.');
    if (!document.getElementById(this.config.iframe.iframeWrapperId)) {
      throw new Error('Payment iframe container does not exist.');
    }
    if (PCPCreditCardTokenizer.active.has(document)) {
      throw new Error('Destroy the active credit-card tokenizer before initializing another form.');
    }
    PCPCreditCardTokenizer.active.set(document, this);
    const sdkUrl = `https://sdk.${mode === 'test' ? 'preprod.' : ''}tokenization.secure.payone.com/1.6.0/hosted-tokenization-sdk.js`;
    const script = document.getElementById('hosted-tokenization-sdk');
    if (script && script.getAttribute('src') !== sdkUrl) {
      throw new Error(
        'Hosted Tokenization SDK environment/version conflicts with the loaded script. Reload the page to switch.',
      );
    }
    if (!window.HostedTokenizationSdk) {
      await loadTokenizerResource({
        id: 'hosted-tokenization-sdk',
        kind: 'script',
        url: sdkUrl,
        integrity: SDK_INTEGRITY,
      });
    }
    const sdk = window.HostedTokenizationSdk;
    if (!sdk?.init || !sdk.getPaymentPage || !sdk.submitForm) {
      removeTokenizerResource(
        'hosted-tokenization-sdk',
        document.getElementById('hosted-tokenization-sdk'),
      );
      throw new Error('Hosted Tokenization SDK is unavailable.');
    }
    const {
      submitButton: _button,
      tokenizationSuccessCallback: _success,
      tokenizationFailureCallback: _failure,
      paymentPageCallback,
      ...vendorConfig
    } = this.config;
    try {
      await sdk.init();
      await sdk.getPaymentPage(
        {
          ...vendorConfig,
          iframe: {
            ...vendorConfig.iframe,
            height: vendorConfig.iframe.height ?? 'auto',
            width: vendorConfig.iframe.width ?? 400,
            zIndex: vendorConfig.iframe.zIndex ?? 9999,
          },
          uiConfig: vendorConfig.uiConfig ?? {},
          locale: vendorConfig.locale ?? 'de_DE',
          mode,
        },
        ...(paymentPageCallback
          ? [
              (status: number | string, response: unknown) => {
                if (!this.destroyed) paymentPageCallback(status, response);
              },
            ]
          : []),
      );
    } catch {
      throw new Error('Failed to initialize Hosted Tokenization SDK.');
    }
    this.submitButtonElement.addEventListener('click', this.submit);
  }

  private readonly submit = (event: Event) => {
    event.preventDefault();
    if (this.destroyed || this.submitting) return;
    this.submitting = true;
    try {
      window.HostedTokenizationSdk!.submitForm(
        (...args) => {
          this.submitting = false;
          if (!this.destroyed) this.config.tokenizationSuccessCallback(...args);
        },
        (status, error) => {
          this.submitting = false;
          if (!this.destroyed) {
            this.config.tokenizationFailureCallback(
              status,
              typeof error === 'string' ? { error } : error,
            );
          }
        },
      );
    } catch {
      this.submitting = false;
      this.config.tokenizationFailureCallback(0, { error: 'Failed to submit tokenization form.' });
    }
  };

  /** Detach this wrapper's event handler and suppress late callbacks. */
  public destroy(): void {
    this.destroyed = true;
    this.submitButtonElement.removeEventListener('click', this.submit);
    if (PCPCreditCardTokenizer.active.get(document) === this) {
      PCPCreditCardTokenizer.active.delete(document);
    }
  }
}
