import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadWalletScript } from '../lib/loadWalletScript.js';

afterEach(() => {
  vi.useRealTimers();
  document.head.innerHTML = '';
});

describe('wallet script lifecycle', () => {
  const src = 'https://wallet.test/sdk.js';
  it('shares an in-flight download and only resolves after script evaluation/load', async () => {
    const first = loadWalletScript('shared-wallet', src);
    const second = loadWalletScript('shared-wallet', src);
    expect(first).toBe(second);
    await expect(loadWalletScript('shared-wallet', 'https://other.test/sdk.js')).rejects.toThrow(
      'already in use',
    );
    const loaded = vi.fn();
    void first.then(loaded);
    await Promise.resolve();
    expect(loaded).not.toHaveBeenCalled();
    const script = document.getElementById('shared-wallet') as HTMLScriptElement;
    expect(script.crossOrigin).toBe('anonymous');
    script.dispatchEvent(new Event('load'));
    await first;
    expect(loaded).toHaveBeenCalledOnce();
  });
  it('waits for an existing script instead of mistaking its presence for readiness', async () => {
    const script = document.createElement('script');
    script.id = 'existing-wallet';
    script.src = src;
    document.head.appendChild(script);
    const promise = loadWalletScript(script.id, src);
    expect(document.querySelectorAll('#existing-wallet')).toHaveLength(1);
    script.dispatchEvent(new Event('load'));
    await promise;
    expect(script.dataset.walletLoaded).toBe('true');
  });
  it('allows a failed download to be retried', async () => {
    const first = loadWalletScript('retry-wallet', src);
    document.getElementById('retry-wallet')!.dispatchEvent(new Event('error'));
    await expect(first).rejects.toThrow('Failed to load');
    const second = loadWalletScript('retry-wallet', src);
    document.getElementById('retry-wallet')!.dispatchEvent(new Event('load'));
    await second;
  });
  it('rejects ID collisions without removing the application element', async () => {
    const element = document.createElement('div');
    element.id = 'occupied-wallet';
    document.head.appendChild(element);
    await expect(loadWalletScript(element.id, src)).rejects.toThrow('already in use');
    expect(document.getElementById(element.id)).toBe(element);
  });
  it('times out a stalled download and removes the failed script', async () => {
    vi.useFakeTimers();
    const promise = loadWalletScript('stalled-wallet', src);
    const rejected = expect(promise).rejects.toThrow('Failed to load');
    await vi.advanceTimersByTimeAsync(30000);
    await rejected;
    expect(document.getElementById('stalled-wallet')).toBeNull();
  });
});
