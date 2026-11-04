import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { loadTokenizerResource } from '../lib/loadTokenizerResource.js';

describe('Tokenizer resource loading', () => {
  let browser: JSDOM;
  const options = { id: 'tokenizer', kind: 'script' as const, url: 'https://sdk.example/sdk.js' };
  beforeEach(() => {
    browser = new JSDOM('', { url: 'https://shop.example' });
    vi.stubGlobal('document', browser.window.document);
  });
  afterEach(() => {
    vi.useRealTimers();
    browser.window.close();
    vi.unstubAllGlobals();
  });
  const signal = (event: string) =>
    document.getElementById(options.id)!.dispatchEvent(new browser.window.Event(event));

  it('shares in-flight loads and reuses the completed resource', async () => {
    const first = loadTokenizerResource(options);
    const second = loadTokenizerResource(options);
    expect(first).toBe(second);
    expect(document.querySelectorAll('script')).toHaveLength(1);
    signal('load');
    await Promise.all([first, second]);
    await loadTokenizerResource(options);
  });
  it('waits for an existing script instead of treating its presence as readiness', async () => {
    const script = document.createElement('script');
    script.id = options.id;
    script.src = options.url;
    document.head.appendChild(script);
    const done = vi.fn();
    const pending = loadTokenizerResource(options).then(done);
    await Promise.resolve();
    expect(done).not.toHaveBeenCalled();
    signal('load');
    await pending;
    expect(done).toHaveBeenCalledOnce();
  });
  it('removes failed scripts and allows retry', async () => {
    const first = loadTokenizerResource(options);
    const rejected = expect(first).rejects.toThrow('Failed to load');
    signal('error');
    await rejected;
    expect(document.getElementById(options.id)).toBeNull();
    const retry = loadTokenizerResource(options);
    signal('load');
    await retry;
  });
  it('times out stalled loads and allows retry', async () => {
    vi.useFakeTimers();
    const pending = loadTokenizerResource(options);
    const rejected = expect(pending).rejects.toThrow('Timed out');
    await vi.advanceTimersByTimeAsync(30_000);
    await rejected;
    const retry = loadTokenizerResource(options);
    signal('load');
    await retry;
  });
  it('rejects conflicting resources without replacing them', async () => {
    const pending = loadTokenizerResource(options);
    await expect(
      loadTokenizerResource({ ...options, url: 'https://other.example/sdk.js' }),
    ).rejects.toThrow('already in use');
    signal('load');
    await pending;
    expect((document.getElementById(options.id) as HTMLScriptElement).src).toBe(options.url);
  });
});
