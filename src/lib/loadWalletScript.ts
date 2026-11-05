const loads = new WeakMap<Document, Map<string, { src: string; promise: Promise<void> }>>();

/** Share in-flight loads, including a script inserted by the application. Retry failed downloads. */
export function loadWalletScript(id: string, src: string): Promise<void> {
  let documentLoads = loads.get(document);
  if (!documentLoads) {
    documentLoads = new Map();
    loads.set(document, documentLoads);
  }
  const previous = documentLoads.get(id);
  if (previous) {
    return previous.src === src
      ? previous.promise
      : Promise.reject(new Error(`Wallet script ID ${id} is already in use.`));
  }
  const ownerDocument = document;
  const promise = new Promise<void>((resolve, reject) => {
    const existing = ownerDocument.getElementById(id);
    if (
      existing &&
      (existing.tagName !== 'SCRIPT' || (existing as HTMLScriptElement).src !== src)
    ) {
      reject(new Error(`Wallet script ID ${id} is already in use.`));
      return;
    }
    const script = (existing as HTMLScriptElement | null) ?? ownerDocument.createElement('script');
    if (script.dataset.walletLoaded === 'true') {
      resolve();
      return;
    }
    const finish = (error?: Error) => {
      clearTimeout(timer);
      script.removeEventListener('load', loaded);
      script.removeEventListener('error', failed);
      if (error) {
        script.remove();
        reject(error);
      } else {
        script.dataset.walletLoaded = 'true';
        resolve();
      }
    };
    const loaded = () => finish();
    const failed = () => finish(new Error(`Failed to load wallet script: ${src}`));
    const timer = setTimeout(failed, 30000);
    script.addEventListener('load', loaded);
    script.addEventListener('error', failed);
    if (!existing) {
      script.id = id;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = src;
      ownerDocument.head.appendChild(script);
    }
  });
  documentLoads.set(id, { src, promise });
  void promise.catch(() => documentLoads.delete(id));
  return promise;
}
