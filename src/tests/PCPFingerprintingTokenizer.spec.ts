import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PCPFingerprintingTokenizer } from '../index.js';

describe('PCPFingerprintingTokenizer', () => {
  let browser: JSDOM;
  let init: ReturnType<typeof vi.fn<(environment: string, snippetToken: string) => void>>;
  beforeEach(() => {
    browser = new JSDOM('<div id="container"></div>', { url: 'https://shop.example' });
    vi.stubGlobal('window', browser.window);
    vi.stubGlobal('document', browser.window.document);
    init = vi.fn();
    window.paylaDcs = { init };
  });
  afterEach(() => {
    browser.window.close();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
  const signal = (id: string, event = 'load') => {
    document.getElementById(id)!.dispatchEvent(new browser.window.Event(event));
  };
  const create = (session?: string) =>
    PCPFingerprintingTokenizer.create('#container', 't', 'partner', 'merchant', session);
  const finish = async (pending: Promise<PCPFingerprintingTokenizer>, loadScript = true) => {
    if (loadScript) signal('paylaDcs');
    await vi.waitFor(() => expect(document.getElementById('paylaDcsStylesheet')).not.toBeNull());
    signal('paylaDcsStylesheet');
    return pending;
  };

  it('initializes the session and returns the matching device token', async () => {
    const tokenizer = await finish(create('session'));
    expect(tokenizer.getUniqueId()).toBe('session');
    expect(tokenizer.getSnippetToken()).toBe('partner_merchant_session');
    expect(init).toHaveBeenCalledWith('t', 'partner_merchant_session');
  });
  it('generates a UUID when no session is supplied', async () => {
    const tokenizer = await finish(create());
    expect(tokenizer.getUniqueId()).toMatch(
      /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/,
    );
  });
  it('reuses the loaded script but initializes the next session and stylesheet', async () => {
    const first = await finish(create('first'));
    const script = document.getElementById('paylaDcs');
    first.destroy();
    expect(document.getElementById('paylaDcsStylesheet')).toBeNull();
    const second = await finish(create('second'), false);
    expect(document.getElementById('paylaDcs')).toBe(script);
    expect(init).toHaveBeenLastCalledWith('t', second.getSnippetToken());
    expect(
      new URL(
        (document.getElementById('paylaDcsStylesheet') as HTMLLinkElement).href,
      ).searchParams.get('st'),
    ).toBe(second.getSnippetToken());
  });
  it('rejects a concurrent session without removing the current stylesheet', async () => {
    await finish(create('first'));
    const stylesheet = document.getElementById('paylaDcsStylesheet');
    await expect(create('second')).rejects.toThrow('Destroy the active');
    expect(document.getElementById('paylaDcsStylesheet')).toBe(stylesheet);
  });
  it('rejects if the loaded vendor API is missing', async () => {
    delete window.paylaDcs;
    const pending = create();
    const rejected = expect(pending).rejects.toThrow('init method');
    signal('paylaDcs');
    await rejected;
  });
  it('propagates initialization errors and allows retry', async () => {
    init.mockImplementationOnce(() => {
      throw new Error('Vendor initialization failed');
    });
    const pending = create();
    const rejected = expect(pending).rejects.toThrow('Vendor initialization failed');
    signal('paylaDcs');
    await rejected;
    await finish(create(), false);
  });
  it('rejects stylesheet failures and permits a fresh session', async () => {
    const pending = create();
    const rejected = expect(pending).rejects.toThrow('Failed to load tokenizer stylesheet');
    signal('paylaDcs');
    await vi.waitFor(() => expect(document.getElementById('paylaDcsStylesheet')).not.toBeNull());
    signal('paylaDcsStylesheet', 'error');
    await rejected;
    await finish(create(), false);
  });
  it('encodes session identifiers without adding query parameters', async () => {
    const tokenizer = await finish(create('session&extra=1'));
    const url = new URL((document.getElementById('paylaDcsStylesheet') as HTMLLinkElement).href);
    expect(url.searchParams.get('st')).toBe(tokenizer.getSnippetToken());
    expect(url.searchParams.has('extra')).toBe(false);
  });
  it('rejects missing containers and invalid environment/IDs', async () => {
    await expect(
      PCPFingerprintingTokenizer.create('#missing', 't', 'partner', 'merchant'),
    ).rejects.toThrow('does not exist');
    await expect(
      PCPFingerprintingTokenizer.create('#container', 'invalid', 'partner', 'merchant'),
    ).rejects.toThrow('environment');
    await expect(
      PCPFingerprintingTokenizer.create('#container', 't', '', 'merchant'),
    ).rejects.toThrow('IDs are required');
  });
});
