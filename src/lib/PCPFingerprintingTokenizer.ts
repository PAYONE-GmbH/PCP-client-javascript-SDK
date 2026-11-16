import { loadTokenizerResource, removeTokenizerResource } from './loadTokenizerResource.js';

declare global {
  interface Window {
    paylaDcs?: { init?: (environment: string, snippetToken: string) => void | Promise<void> };
  }
}

export class PCPFingerprintingTokenizer {
  private stylesheet: Element | null = null;
  private static readonly active = new WeakMap<Document, PCPFingerprintingTokenizer>();
  private selector: string;
  private environment: string;

  private paylaPartnerId: string;
  private partnerMerchantId: string;

  private uniqueId: string;
  private snippetToken: string;

  private paylaScriptId: string;
  private paylaStylesheetId: string;

  /**
   * Creates a new instance of the PCPFingerprintingTokenizer, initializes the Payla fingerprinting snippet, and attaches the Payla stylesheet.
   * @param {string} selector - The selector of the container element in which to mount the Payla fingerprinting snippet.
   * @param {string} environment - Payla environment: "t" (test) or "p" (production). "test" and "live" are accepted aliases.
   * @param {string} paylaPartnerId - The Payla Partner ID.
   * @param {string} partnerMerchantId - The Partner Merchant ID.
   * @param {string} sessionId - The session ID. If not provided, a random GUID(v4) will be generated.
   * @param {string} paylaScriptId - The ID for the Payla script element. Default is "paylaDcs".
   * @param {string} paylaStylesheetId - The ID for the Payla stylesheet element. Default is "paylaDcsStylesheet".
   * @returns {Promise<PCPFingerprintingTokenizer>} A new instance of the PCPFingerprintingTokenizer
   */
  public static async create(
    selector: string,
    environment: string,
    paylaPartnerId: string,
    partnerMerchantId: string,
    sessionId?: string,
    paylaScriptId?: string,
    paylaStylesheetId?: string,
  ) {
    const instance = new PCPFingerprintingTokenizer(
      selector,
      environment,
      paylaPartnerId,
      partnerMerchantId,
      sessionId,
      paylaScriptId,
      paylaStylesheetId,
    );
    try {
      await instance.initialize();
    } catch (error) {
      instance.destroy();
      throw error;
    }
    return instance;
  }

  private constructor(
    selector: string,
    environment: string,
    paylaPartnerId: string,
    partnerMerchantId: string,
    sessionId?: string,
    paylaScriptId?: string,
    paylaStylesheetId?: string,
  ) {
    this.selector = selector;
    this.environment = environment === 'test' ? 't' : environment === 'live' ? 'p' : environment;
    if (!['t', 'p'].includes(this.environment))
      throw new Error('Payla environment must be t or p.');
    if (!paylaPartnerId?.trim() || !partnerMerchantId?.trim()) {
      throw new Error('Payla partner and merchant IDs are required.');
    }

    this.paylaPartnerId = paylaPartnerId;
    this.partnerMerchantId = partnerMerchantId;

    this.paylaScriptId = paylaScriptId || 'paylaDcs';
    this.paylaStylesheetId = paylaStylesheetId || 'paylaDcsStylesheet';

    this.uniqueId = sessionId || this.guidv4();
    // This token gets saved by Payla and is used to identify the session between your server and Payla
    // You need to send this token to your server to identify the session
    this.snippetToken = `${paylaPartnerId}_${partnerMerchantId}_${this.uniqueId}`;
  }

  /**
   * Returns the unique ID of the session.
   * @returns {string} The unique ID of the session.
   */
  public getUniqueId() {
    return this.uniqueId;
  }

  /**
   * Returns the snippet token.
   * The snippet token is a combination of the Payla Partner ID, the Partner Merchant ID, and the unique ID of the session.
   * It is used to identify the session between your server and Payla.
   * You need to send this token to your server to identify the session.
   * @returns {string} The snippet token.
   */
  public getSnippetToken() {
    return this.snippetToken;
  }

  private async initialize() {
    if (!document.querySelector(this.selector)) {
      throw new Error(`Selector ${this.selector} does not exist.`);
    }

    if (PCPFingerprintingTokenizer.active.has(document)) {
      throw new Error(
        'Destroy the active fingerprinting tokenizer before starting another session.',
      );
    }
    PCPFingerprintingTokenizer.active.set(document, this);
    await this.loadScript();
    if (typeof window.paylaDcs?.init !== 'function') {
      removeTokenizerResource(this.paylaScriptId, document.getElementById(this.paylaScriptId));
      throw new Error('paylaDcs is not defined or does not have an init method.');
    }
    await window.paylaDcs.init(this.environment, this.snippetToken);
    await this.loadStylesheet();
  }

  private async loadScript() {
    return loadTokenizerResource({
      id: this.paylaScriptId,
      kind: 'script',
      url: `https://d.payla.io/dcs/${encodeURIComponent(this.paylaPartnerId)}/${encodeURIComponent(this.partnerMerchantId)}/dcs.js`,
      parent: document.querySelector(this.selector)!,
    });
  }

  private async loadStylesheet() {
    const query = new URLSearchParams({
      st: this.snippetToken,
      pi: this.paylaPartnerId,
      psi: this.partnerMerchantId,
      e: this.environment,
    });
    const pending = loadTokenizerResource({
      id: this.paylaStylesheetId,
      kind: 'stylesheet',
      url: `https://d.payla.io/dcs/dcs.css?${query}`,
      parent: document.querySelector(this.selector)!,
    });
    this.stylesheet = document.getElementById(this.paylaStylesheetId);
    await pending;
  }

  /** Release the session stylesheet. The vendor script remains cached for the next session. */
  public destroy(): void {
    if (PCPFingerprintingTokenizer.active.get(document) === this) {
      removeTokenizerResource(this.paylaStylesheetId, this.stylesheet);
      PCPFingerprintingTokenizer.active.delete(document);
    }
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
    const hex = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');

    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
  }
}
