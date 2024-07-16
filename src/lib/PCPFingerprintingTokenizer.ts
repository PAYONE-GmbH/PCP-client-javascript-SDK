declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paylaDcs: any;
  }
}

export class PCPFingerprintingTokenizer {
  private environment: string;
  private snippetToken: string;
  constructor(
    selector: string,
    environment: string,
    paylaPartnerId: string,
    partnerMerchantId: string,
    sessionId?: string,
  ) {
    this.environment = environment;
    const uniqueId = sessionId || this.guidv4();
    this.snippetToken = `${paylaPartnerId}_${partnerMerchantId}_${uniqueId}`;
    this.init(selector, paylaPartnerId, partnerMerchantId);
  }

  private guidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }

  private async init(
    selector: string,
    paylaPartnerId: string,
    partnerMerchantId: string,
  ) {
    // check if selector exists
    if (!document.getElementById(selector)) {
      console.error(`Selector ${selector} does not exist.`);
      return;
    }
    await this.loadScript(selector, paylaPartnerId, partnerMerchantId);
    await this.loadStylesheet(selector, paylaPartnerId, partnerMerchantId);
  }

  private async loadScript(
    selector: string,
    paylaPartnerId: string,
    partnerMerchantId: string,
  ) {
    return new Promise<void>((resolve, reject) => {
      if (document.getElementById('paylaDcs')) {
        resolve(); // Script already loaded
        return;
      }
      const script = document.createElement('script');
      script.id = 'paylaDcs';
      script.type = 'text/javascript';
      script.async = true;
      script.src = `https://d.payla.io/dcs/${paylaPartnerId}/${partnerMerchantId}/dcs.js`;
      script.onload = () => {
        if (typeof window.paylaDcs !== 'undefined' && window.paylaDcs.init) {
          const paylaDcsT = window.paylaDcs.init(
            this.environment,
            this.snippetToken,
          );
          return resolve(paylaDcsT);
        } else {
          console.error(
            'paylaDcs is not defined or does not have an init method.',
          );
          reject();
        }
      };
      script.onerror = reject;
      document.getElementById(selector)!.appendChild(script);
    });
  }

  private async loadStylesheet(
    selector: string,
    paylaPartnerId: string,
    partnerMerchantId: string,
  ) {
    return new Promise<void>((resolve) => {
      if (document.getElementById('paylaDcsStylesheet')) {
        resolve(); // Stylesheet already loaded
        return;
      }
      const link = document.createElement('link');
      link.id = 'paylaDcsStylesheet';
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = `https://d.payla.io/dcs/dcs.css?st=${this.snippetToken}&pi=${paylaPartnerId}&psi=${partnerMerchantId}&e=${this.environment}`;
      document.getElementById(selector)!.appendChild(link);
    });
  }
}
