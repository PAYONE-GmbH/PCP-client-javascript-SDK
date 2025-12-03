import { Config } from '../interfaces/index.js';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HostedTokenizationSdk: any;
  }
}

/**
 * calculate integrity with:
 * curl -s https://sdk.preprod.tokenization.secure.payone.com/1.3.0/hosted-tokenization-sdk.js | openssl dgst -sha384 -binary | openssl base64 -A
 *
 */
const SDK_SCRIPT_ENV = {
  test: {
    src: 'https://sdk.preprod.tokenization.secure.payone.com/1.3.0/hosted-tokenization-sdk.js',
    integrity:
      'sha384-2mqrh4mWkGZN9XmQeJFzKX5t+i9at3NYnUT9qvS2GiMRe8a6pigcsaxGh5y7KwbG',
  },
  live: {
    src: 'https://sdk.tokenization.secure.payone.com/1.3.0/hosted-tokenization-sdk.js',
    integrity:
      'sha384-2mqrh4mWkGZN9XmQeJFzKX5t+i9at3NYnUT9qvS2GiMRe8a6pigcsaxGh5y7KwbG',
  },
};

export class PCPCreditCardTokenizer {
  private readonly config: Config;
  private readonly submitButtonElement: HTMLElement;

  /**
   * Creates a new instance of the PCPCreditCardTokenizer, initializes the Hosted Tokenization SDK, and attaches event handlers to the submit button.
   * @param config - The configuration object for UI and callbacks
   */
  public static async create(config: Config) {
    const instance = new PCPCreditCardTokenizer(config);
    await instance.initialize();
    return instance;
  }

  private constructor(config: Config) {
    this.config = config;
    this.submitButtonElement =
      this.checkForRequiredElementsAndReturnSubmitButtonElement();
  }

  private async initialize() {
    await this.loadHostedTokenizationSdk();

    const sdkConfig: Config = {
      ...this.config,
      iframe: {
        ...this.config.iframe,
        height: this.config.iframe.height || 'auto',
        width: this.config.iframe.width || 400,
        zIndex: this.config.iframe.zIndex || 9999,
      },
      uiConfig: this.config.uiConfig || {},
      locale: this.config.locale || 'de_DE',
      mode: this.config.mode || 'live',
    };

    if (window.HostedTokenizationSdk) {
      try {
        await window.HostedTokenizationSdk.init();
        window.HostedTokenizationSdk.getPaymentPage(sdkConfig);
      } catch (error) {
        console.error('Error initializing Hosted Tokenization SDK:', error);
        throw new Error('Failed to initialize Hosted Tokenization SDK.');
      }

      this.submitButtonElement.onclick = () => {
        window.HostedTokenizationSdk.submitForm(
          this.config.tokenizationSuccessCallback,
          this.config.tokenizationFailureCallback,
        );
      };
    }
  }

  private loadHostedTokenizationSdk(): Promise<void> {
    // If SDK is already present (e.g. in tests), resolve immediately
    if (typeof window !== 'undefined' && window.HostedTokenizationSdk) {
      return Promise.resolve();
    }
    const scriptId = 'hosted-tokenization-sdk';
    return new Promise((resolve, reject) => {
      if (document.getElementById(scriptId)) {
        resolve();
        return;
      }

      // Determine script infos via mode
      const SDK_SCRIPT = SDK_SCRIPT_ENV[this.config.mode || 'live'];

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = SDK_SCRIPT.src;
      script.id = scriptId;
      script.setAttribute('integrity', SDK_SCRIPT.integrity);
      script.setAttribute('crossorigin', 'anonymous');
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Failed to load the Hosted Tokenization SDK script.'));
      document.head.appendChild(script);
    });
  }

  private checkForRequiredElementsAndReturnSubmitButtonElement() {
    const submitButtonElement =
      this.config.submitButton.element ||
      (this.config.submitButton.selector
        ? document.querySelector(this.config.submitButton.selector)
        : undefined);

    if (!submitButtonElement) {
      throw new Error(
        `Submit Button not present. Please provide a valid selector or element.`,
      );
    }
    return submitButtonElement as HTMLElement;
  }
}
