import type { Request } from './crypto';
import { createHash } from './crypto';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Payone: any;
  }
}

export interface FieldConfig {
  selector?: string;
  element?: HTMLElement;
  size?: string;
  maxlength?: string;
  length?: { [key: string]: number };
  type: string;
  style?: string;
  styleFocus?: string;
  iframe?: { width?: string; height?: string };
}

export interface CardTypeFieldConfig
  extends Omit<FieldConfig, 'type' | 'length'> {
  cardtypes: string[];
}

export interface Style {
  input: string;
  inputFocus: string;
  select: string;
  iframe: {
    height: string;
    width: string;
  };
}

export interface AutoCardTypeDetection {
  supportedCardtypes: string[];
  callback: (detectedCardtype: string) => void;
  deactivate?: boolean;
}

export interface Config {
  fields: {
    cardtype?: CardTypeFieldConfig;
    cardpan: FieldConfig;
    cardcvc2: FieldConfig;
    cardexpiremonth: FieldConfig;
    cardexpireyear: FieldConfig;
  };
  defaultStyle: Style;
  autoCardtypeDetection: AutoCardTypeDetection;
  language: string;
  error?: string;
}

export class PCPCreditCardTokenizer {
  private config: Config;
  private request: Request;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private iframes: any;

  constructor(config: Config, request: Request, pmiPortalKey: string) {
    this.config = config;
    this.request = request;
    this.initialize(pmiPortalKey);
  }

  private async initialize(pmiPortalKey: string) {
    await this.loadPayoneScript();
    this.request.hash = await createHash(this.request, pmiPortalKey);
    this.iframes = new window.Payone.ClientApi.HostedIFrames(
      this.config,
      this.request,
    );
    this.attachEventHandlers();
  }

  private loadPayoneScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById('payone-script')) {
        resolve(); // Script already loaded
        return;
      }

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src =
        'https://secure.prelive.pay1-test.de/client-api/js/v1/payone_hosted_min.js';
      script.id = 'payone-script';
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Failed to load the Payone script.'));
      document.head.appendChild(script);
    });
  }

  private attachEventHandlers() {
    document.getElementById('submit')!.onclick = () => {
      this.pay();
    };

    document.getElementById('submitWithOutCompleteCheck')!.onclick = () => {
      this.iframes.creditCardCheck(this.payCallback);
    };
  }

  private pay() {
    if (this.iframes.isComplete()) {
      this.iframes.creditCardCheck(this.payCallback);
    } else {
      alert('Not complete. Nothing done.');
    }
  }

  private payCallback(response: {
    [key: string]: string;
    status: string;
    pseudocardpan: string;
    truncatedcardpan: string;
    cardtype: string;
    cardexpiredate: string;
  }) {
    if (response.status === 'VALID') {
      (document.getElementById('pseudocardpan')! as HTMLInputElement).value =
        response.pseudocardpan;
      (document.getElementById('truncatedcardpan')! as HTMLInputElement).value =
        response.truncatedcardpan;
      (document.getElementById('cardtypeResponse')! as HTMLInputElement).value =
        response.cardtype;
      (
        document.getElementById('cardexpiredateResponse')! as HTMLInputElement
      ).value = response.cardexpiredate;
    }

    if (typeof response === 'object') {
      let responseAsString = 'time: ' + new Date().getTime() + '\n';
      for (const key in response) {
        if (Object.prototype.hasOwnProperty.call(response, key)) {
          responseAsString += key + ': ' + response[key] + '\n';
        }
      }
      document.getElementById('jsonResponsePre')!.innerHTML = responseAsString;
    }
  }
}
