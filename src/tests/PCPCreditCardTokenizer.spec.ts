import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Config, PCPCreditCardTokenizer } from '../index.js';

describe('PCPCreditCardTokenizer (Hosted Tokenization SDK)', () => {
  let document: Document;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let window: any;
  let initMock: ReturnType<typeof vi.fn>;
  let getPaymentPageMock: ReturnType<typeof vi.fn>;
  let submitFormMock: ReturnType<typeof vi.fn>;
  let successCallback: ReturnType<typeof vi.fn>;
  let failureCallback: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const { window: jsdomWindow } = new JSDOM(
      '<!DOCTYPE html><body><div id="payment-IFrame"></div><button id="submit"></button><pre id="jsonResponsePre"></pre></body>',
      { url: 'http://localhost' },
    );
    document = jsdomWindow.document;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window = jsdomWindow as any;
    global.document = document;
    global.window = window;

    // Mock HostedTokenizationSdk
    initMock = vi.fn().mockResolvedValue(undefined);
    getPaymentPageMock = vi.fn();
    submitFormMock = vi.fn();
    window.HostedTokenizationSdk = {
      init: initMock,
      getPaymentPage: getPaymentPageMock,
      submitForm: submitFormMock,
    };

    successCallback = vi.fn();
    failureCallback = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize the SDK and render the payment page', async () => {
    const config: Config = {
      iframe: {
        iframeWrapperId: 'payment-IFrame',
        height: 400,
        width: 400,
        zIndex: 42,
      },
      uiConfig: {},
      locale: 'de_DE',
      submitButton: { selector: '#submit' },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
      environment: 'test',
      token: 'dummy-jwt',
    };

    await PCPCreditCardTokenizer.create(config);

    expect(initMock).toHaveBeenCalled();
    expect(getPaymentPageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        iframe: expect.objectContaining({
          iframeWrapperId: 'payment-IFrame',
          height: 400,
          width: 400,
          zIndex: 42,
        }),
        uiConfig: {},
        locale: 'de_DE',
        token: 'dummy-jwt',
      }),
    );
  });

  it('should call submitForm with the correct callbacks when the submit button is clicked', async () => {
    const config: Config = {
      iframe: { iframeWrapperId: 'payment-IFrame', height: 400, width: 400 },
      uiConfig: {},
      locale: 'de_DE',
      submitButton: { selector: '#submit' },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
      environment: 'test',
      token: 'dummy-jwt',
    };

    await PCPCreditCardTokenizer.create(config);

    const submitButton = document.querySelector('#submit') as HTMLButtonElement;
    submitButton.click();

    expect(submitFormMock).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('should throw if the submit button is not found', async () => {
    const config: Config = {
      iframe: { iframeWrapperId: 'payment-IFrame', height: 400, width: 400 },
      uiConfig: {},
      locale: 'de_DE',
      submitButton: { selector: '#notfound' },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
      environment: 'test',
      token: 'dummy-jwt',
    };

    await expect(PCPCreditCardTokenizer.create(config)).rejects.toThrow(
      'Submit Button not present. Please provide a valid selector or element.',
    );
  });

  it('should use submitButton.element if provided', async () => {
    const button = document.createElement('button');
    button.id = 'element-btn';
    document.body.appendChild(button);
    const config: Config = {
      iframe: { iframeWrapperId: 'payment-IFrame', height: 400, width: 400 },
      uiConfig: {},
      locale: 'de_DE',
      submitButton: { element: button },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
      environment: 'test',
      token: 'dummy-jwt',
    };
    await PCPCreditCardTokenizer.create(config);
    button.click();
    expect(submitFormMock).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('should throw if HostedTokenizationSdk.init throws', async () => {
    window.HostedTokenizationSdk.init = vi
      .fn()
      .mockRejectedValue(new Error('init fail'));
    const config: Config = {
      iframe: { iframeWrapperId: 'payment-IFrame', height: 400, width: 400 },
      uiConfig: {},
      locale: 'de_DE',
      submitButton: { selector: '#submit' },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
      environment: 'test',
      token: 'dummy-jwt',
    };
    await expect(PCPCreditCardTokenizer.create(config)).rejects.toThrow(
      'Failed to initialize Hosted Tokenization SDK.',
    );
  });

  it('should reject if the SDK script fails to load', async () => {
    // Remove the SDK from window to force script loading
    delete window.HostedTokenizationSdk;
    // Remove any existing script
    const existing = document.getElementById('hosted-tokenization-sdk');
    if (existing) existing.remove();
    // Mock script creation to trigger error
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement');
    createElementSpy.mockImplementation((tagName: string) => {
      if (tagName === 'script') {
        const script = originalCreateElement('div');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (script as any).setAttribute('id', 'hosted-tokenization-sdk');
        setTimeout(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          () => (script as any).onerror && (script as any).onerror(),
          0,
        );
        return script;
      }
      return originalCreateElement(tagName);
    });
    const config: Config = {
      iframe: { iframeWrapperId: 'payment-IFrame', height: 400, width: 400 },
      uiConfig: {},
      locale: 'de_DE',
      submitButton: { selector: '#submit' },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
      environment: 'test',
      token: 'dummy-jwt',
    };
    await expect(PCPCreditCardTokenizer.create(config)).rejects.toThrow(
      'Failed to load the Hosted Tokenization SDK script.',
    );
    createElementSpy.mockRestore();
  });
});
