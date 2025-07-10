import { Config } from '../interfaces/index.js';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HostedTokenizationSdk: any;
  }
}

export class PCPCreditCardTokenizer {
  private config: Config;
  private readonly jwtToken: string;
  private submitButtonElement: HTMLElement;

  /**
   * Creates a new instance of the PCPCreditCardTokenizer, initializes the Hosted Tokenization SDK, and attaches event handlers to the submit button.
   * @param {Config} config - The configuration object for UI and callbacks
   * @param {string} jwtToken - The JWT token from your backend (CommercePlatform-API)
   * @returns {Promise<PCPCreditCardTokenizer>} A new instance of the PCPCreditCardTokenizer
   */
  public static async create(config: Config, jwtToken: string) {
    const instance = new PCPCreditCardTokenizer(config, jwtToken);
    await instance.initialize();
    return instance;
  }

  private constructor(config: Config, jwtToken: string) {
    this.config = config;
    this.jwtToken = jwtToken;
    this.submitButtonElement =
      this.checkForRequiredElementsAndReturnSubmitButtonElement();
  }

  private async initialize() {
    await this.loadHostedTokenizationSdk();

    const sdkConfig = {
      iframe: {
        iframeWrapperId:
          this.config.iframe?.iframeWrapperId || 'payment-IFrame',
        height: this.config.iframe?.height || 400,
        width: this.config.iframe?.width || 400,
      },
      uiConfig: this.config.uiConfig || {},
      locale: this.config.locale || 'de_DE',
      token: this.jwtToken,
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
          this.tokenizationSuccessCallback,
          this.tokenizationFailureCallback,
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
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src =
        'https://sdk.preprod.tokenization.secure.payone.com/1.0.1/hosted-tokenization-sdk.js';
      script.id = scriptId;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Failed to load the Hosted Tokenization SDK script.'));
      document.head.appendChild(script);
    });
  }

  private readonly tokenizationSuccessCallback = (
    statusCode: number,
    token: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cardDetails: any,
  ) => {
    if (this.config.tokenizationSuccessCallback) {
      this.config.tokenizationSuccessCallback(statusCode, token, cardDetails);
    }
  };

  private readonly tokenizationFailureCallback = (
    statusCode: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errorResponse: any,
  ) => {
    if (this.config.tokenizationFailureCallback) {
      this.config.tokenizationFailureCallback(statusCode, errorResponse);
    }
  };

  private checkForRequiredElementsAndReturnSubmitButtonElement() {
    const submitButtonElement =
      this.config.submitButton?.element ||
      document.querySelector(this.config.submitButton?.selector as string);

    if (!submitButtonElement) {
      throw new Error(
        `Submit Button not present. Please provide a valid selector or element.`,
      );
    }
    return submitButtonElement as HTMLElement;
  }
}
