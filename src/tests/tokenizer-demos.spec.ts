import { readFileSync } from 'node:fs';

import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ card: vi.fn(), fingerprint: vi.fn(), destroy: vi.fn() }));
vi.mock('pcp-client-javascript-sdk', () => ({
  PCPCreditCardTokenizer: { create: mocks.card },
  PCPFingerprintingTokenizer: { create: mocks.fingerprint },
}));

describe('Tokenizer demos', () => {
  let browser: JSDOM;
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    mocks.card.mockResolvedValue({ destroy: mocks.destroy });
    mocks.fingerprint.mockResolvedValue({
      destroy: mocks.destroy,
      getUniqueId: () => 'checkout-session',
      getSnippetToken: () => 'partner_merchant_checkout-session',
    });
  });
  afterEach(() => {
    browser?.window.close();
    vi.unstubAllGlobals();
  });
  const mount = (demo: string) => {
    browser = new JSDOM(readFileSync(`${demo}/index.html`, 'utf8'), {
      url: 'https://shop.example',
    });
    vi.stubGlobal('window', browser.window);
    vi.stubGlobal('document', browser.window.document);
    vi.stubGlobal('FormData', browser.window.FormData);
  };
  const input = (id: string, value: string) => {
    document.querySelector<HTMLInputElement>(`#${id}`)!.value = value;
  };
  const submit = () =>
    document
      .getElementById('setup')!
      .dispatchEvent(new browser.window.Event('submit', { cancelable: true }));

  it('initializes the card form from user input and displays results as text', async () => {
    mount('creditcard-tokenizer-demo');
    await import('../../creditcard-tokenizer-demo/src/main.js');
    const button = document.querySelector<HTMLInputElement>('#submit')!;
    expect(button.disabled).toBe(true);
    expect(mocks.card).not.toHaveBeenCalled();
    input('token', 'backend-jwt');
    submit();
    await vi.waitFor(() => expect(button.disabled).toBe(false));
    const config = mocks.card.mock.calls[0][0];
    expect(config).toMatchObject({
      token: 'backend-jwt',
      mode: 'test',
      isSecurityCodeMasked: true,
    });
    config.tokenizationSuccessCallback(201, '<img src=x>', { cardNumber: '****1234' }, 'manual');
    expect(document.getElementById('result')!.textContent).toContain('<img src=x>');
    expect(document.querySelector('#result img')).toBeNull();
    browser.window.dispatchEvent(new browser.window.Event('pagehide'));
    expect(mocks.destroy).toHaveBeenCalledOnce();
  });
  it('shows card initialization errors and keeps tokenization disabled', async () => {
    mount('creditcard-tokenizer-demo');
    mocks.card.mockRejectedValue(new Error('JWT expired'));
    await import('../../creditcard-tokenizer-demo/src/main.js');
    input('token', 'expired-jwt');
    submit();
    await vi.waitFor(() =>
      expect(document.getElementById('result')!.textContent).toBe('JWT expired'),
    );
    expect(document.querySelector<HTMLInputElement>('#submit')!.disabled).toBe(true);
    expect(document.querySelector<HTMLButtonElement>('#initialize')!.disabled).toBe(false);
  });
  it('displays asynchronous vendor rendering errors and disables submission', async () => {
    mount('creditcard-tokenizer-demo');
    await import('../../creditcard-tokenizer-demo/src/main.js');
    input('token', 'backend-jwt');
    submit();
    await vi.waitFor(() =>
      expect(document.querySelector<HTMLInputElement>('#submit')!.disabled).toBe(false),
    );
    mocks.card.mock.calls[0][0].paymentPageCallback(400, { error: 'Invalid JWT' });
    expect(document.getElementById('result')!.textContent).toContain('Invalid JWT');
    expect(document.querySelector<HTMLInputElement>('#submit')!.disabled).toBe(true);
  });

  it('passes the fingerprinting form values and displays the matching device token', async () => {
    mount('fingerprinting-tokenizer-demo');
    await import('../../fingerprinting-tokenizer-demo/src/main.js');
    input('partner', 'partner');
    input('merchant', 'merchant');
    input('session', 'checkout-session');
    submit();
    await vi.waitFor(() =>
      expect(document.getElementById('result')!.textContent).toContain(
        'partner_merchant_checkout-session',
      ),
    );
    expect(mocks.fingerprint).toHaveBeenCalledWith(
      '#fingerprinting',
      't',
      'partner',
      'merchant',
      'checkout-session',
    );
    submit();
    await vi.waitFor(() => expect(mocks.fingerprint).toHaveBeenCalledTimes(2));
    expect(mocks.destroy).toHaveBeenCalledOnce();
  });
  it('shows fingerprinting load failures and permits retry', async () => {
    mount('fingerprinting-tokenizer-demo');
    mocks.fingerprint.mockRejectedValue(new Error('Script unavailable'));
    await import('../../fingerprinting-tokenizer-demo/src/main.js');
    input('partner', 'partner');
    input('merchant', 'merchant');
    submit();
    await vi.waitFor(() =>
      expect(document.getElementById('result')!.textContent).toBe('Script unavailable'),
    );
    expect(document.querySelector<HTMLButtonElement>('#initialize')!.disabled).toBe(false);
  });
});
