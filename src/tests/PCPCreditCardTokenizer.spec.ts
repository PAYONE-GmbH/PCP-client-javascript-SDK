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
      iframe: { iframeWrapperId: 'payment-IFrame', height: 400, width: 400 },
      uiConfig: {},
      locale: 'de_DE',
      submitButton: { selector: '#submit' },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
    };
    const jwtToken = 'dummy-jwt';

    await PCPCreditCardTokenizer.create(config, jwtToken);

    expect(initMock).toHaveBeenCalled();
    expect(getPaymentPageMock).toHaveBeenCalledWith({
      iframe: { iframeWrapperId: 'payment-IFrame', height: 400, width: 400 },
      uiConfig: {},
      locale: 'de_DE',
      token: jwtToken,
    });
  });

  it('should call submitForm with the correct callbacks when the submit button is clicked', async () => {
    const config: Config = {
      iframe: { iframeWrapperId: 'payment-IFrame', height: 400, width: 400 },
      uiConfig: {},
      locale: 'de_DE',
      submitButton: { selector: '#submit' },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
    };
    const jwtToken = 'dummy-jwt';

    await PCPCreditCardTokenizer.create(config, jwtToken);

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
    };
    const jwtToken = 'dummy-jwt';

    await expect(
      PCPCreditCardTokenizer.create(config, jwtToken),
    ).rejects.toThrow(
      'Submit Button not present. Please provide a valid selector or element.',
    );
  });
});
