type ResourceOptions = {
  id: string;
  url: string;
  kind: 'script' | 'stylesheet';
  parent?: Element;
  integrity?: string;
};

const resources = new WeakMap<
  Document,
  Map<string, { signature: string; promise: Promise<void> }>
>();

/** Share in-flight loads, reject conflicting IDs, and allow retry after a failed load. */
export function loadTokenizerResource(options: ResourceOptions): Promise<void> {
  const owner = document;
  let entries = resources.get(owner);
  if (!entries) {
    entries = new Map();
    resources.set(owner, entries);
  }
  const url = new URL(options.url, owner.baseURI).href;
  const signature = `${options.kind}:${url}:${options.integrity ?? ''}`;
  const cached = entries.get(options.id);
  if (cached) {
    return cached.signature === signature
      ? cached.promise
      : Promise.reject(new Error(`Tokenizer resource ID is already in use: ${options.id}`));
  }
  const existing = owner.getElementById(options.id);
  const tag = options.kind === 'script' ? 'SCRIPT' : 'LINK';
  if (
    existing &&
    (existing.tagName !== tag ||
      existing.getAttribute(options.kind === 'script' ? 'src' : 'href') !== url ||
      (options.integrity && existing.getAttribute('integrity') !== options.integrity))
  ) {
    return Promise.reject(new Error(`Tokenizer resource ID is already in use: ${options.id}`));
  }
  const element = existing ?? owner.createElement(options.kind === 'script' ? 'script' : 'link');
  const promise = new Promise<void>((resolve, reject) => {
    if (element.dataset.tokenizerLoaded === 'true') {
      resolve();
      return;
    }
    const finish = (error?: Error) => {
      clearTimeout(timer);
      element.removeEventListener('load', loaded);
      element.removeEventListener('error', failed);
      if (error) {
        element.remove();
        reject(error);
      } else {
        element.dataset.tokenizerLoaded = 'true';
        resolve();
      }
    };
    const loaded = () => finish();
    const failed = () => finish(new Error(`Failed to load tokenizer ${options.kind}.`));
    const timer = setTimeout(
      () => finish(new Error(`Timed out loading tokenizer ${options.kind}.`)),
      30_000,
    );
    element.addEventListener('load', loaded);
    element.addEventListener('error', failed);
    if (!existing) {
      element.id = options.id;
      if (options.kind === 'script') {
        const script = element as HTMLScriptElement;
        script.src = url;
        script.async = true;
        if (options.integrity) {
          script.integrity = options.integrity;
          script.crossOrigin = 'anonymous';
        }
      } else {
        const link = element as HTMLLinkElement;
        link.rel = 'stylesheet';
        link.href = url;
      }
      (options.parent ?? owner.head).appendChild(element);
    }
  });
  const tracked = promise.catch((error: unknown) => {
    entries.delete(options.id);
    throw error;
  });
  entries.set(options.id, { signature, promise: tracked });
  return tracked;
}

/** Release a resource when its session ends or its vendor API failed to load. */
export function removeTokenizerResource(id: string, element: Element | null): void {
  if (element && document.getElementById(id) === element) {
    element.remove();
    resources.get(document)?.delete(id);
  }
}
