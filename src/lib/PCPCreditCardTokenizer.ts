import { Cardtype, Config } from '../interfaces/index.js';
import type { Request } from './crypto.js';
import { createHash } from './crypto.js';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Payone: any;
    payCallback: (response: {
      [key: string]: string;
      status: string;
      pseudocardpan: string;
      truncatedcardpan: string;
      cardtype: string;
      cardexpiredate: string;
    }) => void;
  }
}

export class PCPCreditCardTokenizer {
  private config: Config;
  private request: Request;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private iframes: any;

  static async create(
    config: Config,
    request: Omit<Request, 'hash'>,
    pmiPortalKey: string,
  ) {
    const instance = new PCPCreditCardTokenizer(config, request);
    await instance.initialize(pmiPortalKey);
    return instance;
  }

  private constructor(config: Config, request: Omit<Request, 'hash'>) {
    this.config = config;
    this.request = request;
  }

  private async initialize(pmiPortalKey: string) {
    this.checkForRequiredElements();
    await this.loadPayoneScript();
    this.request.hash = await createHash(this.request, pmiPortalKey);
    this.iframes = new window.Payone.ClientApi.HostedIFrames(
      this.config,
      this.request,
    );
    this.attachEventHandlers();
    if (this.config.ccIcons?.selector) {
      this.createCreditCardIconElements(this.config.ccIcons);
    }

    // add callback function to window object so it can be called by the Payone script
    window.payCallback = this.payCallback;
  }

  private checkForRequiredElements() {
    if (!document.getElementById(this.config.submitButtonId)) {
      throw new Error(
        `Submit Button with id ${this.config.submitButtonId} not found.`,
      );
    }

    if (
      this.config.ccIcons &&
      !document.querySelector(this.config.ccIcons.selector)
    ) {
      throw new Error(
        `Container for Credit Card Icons with selector ${this.config.ccIcons.selector} not found.`,
      );
    }
  }

  private createCreditCardIconElements(ccIcons: Config['ccIcons']) {
    const selector = ccIcons!.selector;
    const style = ccIcons!.style;
    const container = document.querySelector(selector)!;

    this.config.autoCardtypeDetection.supportedCardtypes.forEach((cardtype) => {
      const selector = ccIcons!.mapCardtypeToSelector?.[cardtype as Cardtype];
      const type = cardtype.toLowerCase();
      const img = document.createElement('img');
      img.className = 'cc-icon';
      img.src = `https://cdn.pay1.de/cc/${type}/l/default.png`;
      img.alt = `${type} Icon`;
      img.setAttribute('data-cc-type', type);
      if (style) {
        for (const key in style) {
          const value = style[key];
          if (value) {
            img.style.setProperty(key, value);
          }
        }
      }
      if (selector) {
        img.setAttribute('cc-selector', selector);
      }
      container.appendChild(img);
    });
  }

  private loadPayoneScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById('payone-hosted-script')) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src =
        'https://secure.prelive.pay1-test.de/client-api/js/v1/payone_hosted_min.js';
      script.id = 'payone-hosted-script';
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Failed to load the Payone script.'));
      document.head.appendChild(script);
    });
  }

  private attachEventHandlers() {
    const submitButton = document.getElementById(this.config.submitButtonId)!;
    submitButton.onclick = () => {
      this.pay();
    };

    if (this.config.submitButtonWithOutCompleteCheckId) {
      const submitButtonWithOutCompleteCheck = document.getElementById(
        this.config.submitButtonWithOutCompleteCheckId,
      );
      if (submitButtonWithOutCompleteCheck) {
        submitButtonWithOutCompleteCheck.onclick = () => {
          this.iframes.creditCardCheck('payCallback');
        };
      }
    }
  }

  private pay() {
    if (this.iframes.isComplete()) {
      this.iframes.creditCardCheck('payCallback');
    } else {
      this.config.formNotCompleteCallback?.();
    }
  }

  private payCallback = (response: {
    [key: string]: string;
    status: string;
    pseudocardpan: string;
    truncatedcardpan: string;
    cardtype: string;
    cardexpiredate: string;
  }) => {
    this.config.creditCardCheckCallback(response);
  };
}
