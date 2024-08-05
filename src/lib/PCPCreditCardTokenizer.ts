import { Cardtype, Config, Request } from '../interfaces/index.js';
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

  private submitButtonElement: HTMLElement;
  private submitButtonWithOutCompleteCheckElement?: HTMLElement;

  private ccIconsContainerElement?: HTMLElement;

  /**
   * Creates a new instance of the PCPCreditCardTokenizer, initializes the Payone script, and attaches event handlers to the submit button.
   * @param {Config} config - The configuration object sets up styles, auto card type detection, credit card icons, and callbacks
   * @param {Omit<Request, 'hash'>} request - The request object contains the parameters for the Payone API
   * @param {string} pmiPortalKey - The pmiPortalKey is used to create a hash for the request object
   * @returns {Promise<PCPCreditCardTokenizer>} A new instance of the PCPCreditCardTokenizer
   */
  public static async create(
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
    this.checkForRequiredElementsForConfigFields();
    this.submitButtonElement =
      this.checkForRequiredElementsAndReturnSubmitButtonElement();
  }

  private async initialize(pmiPortalKey: string) {
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

  private checkForRequiredElementsForConfigFields() {
    const cardPanRequiredField =
      this.config.fields.cardpan.element ||
      document.querySelector(
        `#${this.config.fields.cardpan.selector as string}`,
      );
    const cardCvc2RequiredField =
      this.config.fields.cardcvc2.element ||
      document.querySelector(
        `#${this.config.fields.cardcvc2.selector as string}`,
      );
    const cardExpireMonthRequiredField =
      this.config.fields.cardexpiremonth.element ||
      document.querySelector(
        `#${this.config.fields.cardexpiremonth.selector as string}`,
      );
    const cardExpireYearRequiredField =
      this.config.fields.cardexpireyear.element ||
      document.querySelector(
        `#${this.config.fields.cardexpireyear.selector as string}`,
      );

    const missingElements = [];
    if (!cardPanRequiredField) {
      missingElements.push('cardpan');
    }
    if (!cardCvc2RequiredField) {
      missingElements.push('cardcvc2');
    }
    if (!cardExpireMonthRequiredField) {
      missingElements.push('cardexpiremonth');
    }
    if (!cardExpireYearRequiredField) {
      missingElements.push('cardexpireyear');
    }
    if (missingElements.length > 0) {
      throw new Error(
        `The following container elements are missing: ${missingElements.join(', ')}. Please provide valid selectors or elements.`,
      );
    }
  }

  private checkForRequiredElementsAndReturnSubmitButtonElement() {
    if (this.config.ccIcons) {
      const ccIconsContainerElement =
        this.config.ccIcons.element ||
        document.querySelector(this.config.ccIcons.selector as string);
      if (!ccIconsContainerElement) {
        throw new Error(
          `Container for Credit Card Icons not present. Please provide a valid selector or element.`,
        );
      }
      this.ccIconsContainerElement = ccIconsContainerElement as HTMLElement;
    }

    if (this.config.submitButtonWithOutCompleteCheck) {
      const submitButtonWithOutCompleteCheckElement =
        this.config.submitButtonWithOutCompleteCheck.element ||
        document.querySelector(
          this.config.submitButtonWithOutCompleteCheck.selector as string,
        );
      if (!submitButtonWithOutCompleteCheckElement) {
        throw new Error(
          `Submit Button without complete check not present. Please provide a valid selector or element.`,
        );
      }
      this.submitButtonWithOutCompleteCheckElement =
        submitButtonWithOutCompleteCheckElement as HTMLElement;
    }

    const submitButtonElement =
      this.config.submitButton.element ||
      document.querySelector(this.config.submitButton.selector as string);
    console.log(
      'submitButtonElement',
      submitButtonElement,
      this.config.submitButton.selector,
    );
    if (!submitButtonElement) {
      throw new Error(
        `Submit Button not present. Please provide a valid selector or element.`,
      );
    }
    return submitButtonElement as HTMLElement;
  }

  private createCreditCardIconElements(ccIcons: Config['ccIcons']) {
    const style = ccIcons!.style;

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
      this.ccIconsContainerElement!.appendChild(img);
    });
  }

  private loadPayoneScript(): Promise<void> {
    const scriptId = this.config.payOneScriptId || 'payone-hosted-script';
    return new Promise((resolve, reject) => {
      if (document.getElementById(scriptId)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src =
        'https://secure.prelive.pay1-test.de/client-api/js/v1/payone_hosted_min.js';
      script.id = scriptId;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Failed to load the Payone script.'));
      document.head.appendChild(script);
    });
  }

  private attachEventHandlers() {
    this.submitButtonElement.onclick = () => {
      this.pay();
    };

    if (this.config.submitButtonWithOutCompleteCheck) {
      this.submitButtonWithOutCompleteCheckElement!.onclick = () => {
        this.iframes.creditCardCheck('payCallback');
      };
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
