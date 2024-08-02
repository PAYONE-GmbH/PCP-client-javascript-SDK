declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paylaDcs: any;
  }
}

export class PCPFingerprintingTokenizer {
  private selector: string;
  private environment: string;

  private paylaPartnerId: string;
  private partnerMerchantId: string;

  private uniqueId: string;
  private snippetToken: string;

  public static async create(
    selector: string,
    environment: string,
    paylaPartnerId: string,
    partnerMerchantId: string,
    sessionId?: string,
  ) {
    const instance = new PCPFingerprintingTokenizer(
      selector,
      environment,
      paylaPartnerId,
      partnerMerchantId,
      sessionId,
    );
    await instance.initialize();
    return instance;
  }

  private constructor(
    selector: string,
    environment: string,
    paylaPartnerId: string,
    partnerMerchantId: string,
    sessionId?: string,
  ) {
    this.selector = selector;
    this.environment = environment;

    this.paylaPartnerId = paylaPartnerId;
    this.partnerMerchantId = partnerMerchantId;

    this.uniqueId = sessionId || this.guidv4();
    // This token gets saved by Payla and is used to identify the session between your server and Payla
    // You need to send this token to your server to identify the session
    this.snippetToken = `${paylaPartnerId}_${partnerMerchantId}_${this.uniqueId}`;
  }

  public getUniqueId() {
    return this.uniqueId;
  }

  public getSnippetToken() {
    return this.snippetToken;
  }

  private async initialize() {
    if (!document.querySelector(this.selector)) {
      throw new Error(`Selector ${this.selector} does not exist.`);
    }

    window.paylaDcs = window.paylaDcs || {};
    await this.loadScript();
    await this.loadStylesheet();
  }

  private async loadScript() {
    return new Promise<void>((resolve, reject) => {
      if (document.getElementById('paylaDcs')) {
        resolve(); // Script already loaded
        return;
      }
      const script = document.createElement('script');
      script.id = 'paylaDcs';
      script.type = 'text/javascript';
      script.src = `https://d.payla.io/dcs/${this.paylaPartnerId}/${this.partnerMerchantId}/dcs.js`;
      script.onload = () => {
        if (typeof window.paylaDcs !== 'undefined' && window.paylaDcs.init) {
          window.paylaDcs.init(this.environment, this.snippetToken);
        } else {
          throw new Error(
            'paylaDcs is not defined or does not have an init method.',
          );
        }
        return resolve();
      };
      script.onerror = () =>
        reject(new Error('Failed to load the Payla script.'));
      document.querySelector(this.selector)!.appendChild(script);
    });
  }

  private async loadStylesheet() {
    return new Promise<void>((resolve, reject) => {
      if (document.getElementById('paylaDcsStylesheet')) {
        resolve(); // Stylesheet already loaded
        return;
      }
      const link = document.createElement('link');
      link.id = 'paylaDcsStylesheet';
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = `https://d.payla.io/dcs/dcs.css?st=${this.snippetToken}&pi=${this.paylaPartnerId}&psi=${this.partnerMerchantId}&e=${this.environment}`;
      link.onload = () => resolve();
      link.onerror = () =>
        reject(new Error('Failed to load the Payla stylesheet.'));
      document.querySelector(this.selector)!.appendChild(link);
    });
  }

  private guidv4() {
    // Create an array to hold 16 random bytes
    const array = new Uint8Array(16);
    // Populate the array with random values
    crypto.getRandomValues(array);

    // Adjust specific bytes according to RFC 4122 section 4.4
    // Set the 4 most significant bits of the 7th byte to 0100 (i.e., set the UUID version to 4)
    array[6] = (array[6] & 0x0f) | 0x40;
    // Set the 2 most significant bits of the 9th byte to 10 (i.e., set the UUID variant to RFC 4122)
    array[8] = (array[8] & 0x3f) | 0x80;

    // Convert the array to a string in the format of a UUID
    const hex = Array.from(array, (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('');

    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
  }
}
