import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type Config,
  type CTPConfig,
  type CustomIconsConfig,
  PCPCreditCardTokenizer,
} from '../index.js';

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
      mode: 'test',
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
      mode: 'test',
      token: 'dummy-jwt',
    };

    await PCPCreditCardTokenizer.create(config);

    const submitButton = document.querySelector('#submit') as HTMLButtonElement;
    submitButton.click();

    expect(submitFormMock).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
  });

  it('should throw if the submit button is not found', async () => {
    const config: Config = {
      iframe: { iframeWrapperId: 'payment-IFrame', height: 400, width: 400 },
      uiConfig: {},
      locale: 'de_DE',
      submitButton: { selector: '#notfound' },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
      mode: 'test',
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
      mode: 'test',
      token: 'dummy-jwt',
    };
    await PCPCreditCardTokenizer.create(config);
    button.click();
    expect(submitFormMock).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
  });

  it('should throw if HostedTokenizationSdk.init throws', async () => {
    window.HostedTokenizationSdk.init = vi.fn().mockRejectedValue(new Error('init fail'));
    const config: Config = {
      iframe: { iframeWrapperId: 'payment-IFrame', height: 400, width: 400 },
      uiConfig: {},
      locale: 'de_DE',
      submitButton: { selector: '#submit' },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
      mode: 'test',
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
          // biome-ignore lint/complexity/useOptionalChain: <ok>
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
      mode: 'test',
      submitButton: { selector: '#submit' },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
      token: 'dummy-jwt',
    };
    await expect(PCPCreditCardTokenizer.create(config)).rejects.toThrow(
      'Failed to load the Hosted Tokenization SDK script.',
    );
    createElementSpy.mockRestore();
  });

  it('should pass customTextConfig with multiple locales', async () => {
    const config: Config = {
      iframe: { iframeWrapperId: 'payment-IFrame', height: 400, width: 400 },
      uiConfig: {},
      locale: 'en_US',
      submitButton: { selector: '#submit' },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
      mode: 'test',
      token: 'dummy-jwt',
      customTextConfig: {
        en: {
          labels: {
            cardNumber: 'Card Number',
            cardholderName: 'Cardholder Name',
            expiryDate: 'Expiry Date',
            securityCode: 'Security Code',
          },
          placeholders: {
            cardNumber: '1234 5678 9012 3456',
            cardholderName: 'John Doe',
            expiryDate: 'MM/YY',
            securityCode: 'CVV',
          },
          arialabels: {
            cardNumber: 'Enter your card number',
            cardholderName: 'Enter the name on the card',
            expiryDate: 'Enter the expiration month and year',
            securityCode: 'Enter the card verification code',
          },
          errors: {
            cardNumber: {
              isRequired: 'Card number is required',
              isInvalid: 'Invalid card number',
              isTooShort: 'Card number is too short',
              notSupported: 'Card type not supported',
            },
            cardholderName: {
              isRequired: 'Cardholder name is required',
              isInvalid: 'Invalid cardholder name',
            },
            expiryDate: {
              isRequired: 'Expiry date is required',
              isInvalid: 'Invalid expiry date',
            },
            securityCode: {
              isRequired: 'Security code is required',
              amexCardSecurityCodeError: 'Invalid Amex security code',
              generalSecurityCodeError: 'Invalid security code',
            },
          },
        },
        de: {
          labels: {
            cardNumber: 'Kartennummer',
            cardholderName: 'Karteninhaber',
            expiryDate: 'Ablaufdatum',
            securityCode: 'Sicherheitscode',
          },
        },
        fr: {
          labels: {
            cardNumber: 'Numéro de carte',
            cardholderName: 'Nom du titulaire',
            expiryDate: "Date d'expiration",
            securityCode: 'Code de sécurité',
          },
        },
      },
    };

    await PCPCreditCardTokenizer.create(config);

    expect(initMock).toHaveBeenCalled();
    expect(getPaymentPageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        customTextConfig: expect.objectContaining({
          en: expect.objectContaining({
            labels: expect.objectContaining({
              cardNumber: 'Card Number',
              expiryDate: 'Expiry Date',
              securityCode: 'Security Code',
            }),
            errors: expect.objectContaining({
              securityCode: expect.objectContaining({
                amexCardSecurityCodeError: 'Invalid Amex security code',
              }),
            }),
          }),
          de: expect.objectContaining({
            labels: expect.objectContaining({
              cardNumber: 'Kartennummer',
            }),
          }),
          fr: expect.objectContaining({
            labels: expect.objectContaining({
              cardNumber: 'Numéro de carte',
            }),
          }),
        }),
      }),
    );
  });

  it('should pass allowedCardSchemes configuration', async () => {
    const config: Config = {
      iframe: { iframeWrapperId: 'payment-IFrame', height: 400, width: 400 },
      uiConfig: {},
      locale: 'en_US',
      submitButton: { selector: '#submit' },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
      mode: 'test',
      token: 'dummy-jwt',
      allowedCardSchemes: ['visa', 'mastercard', 'amex'],
    };

    await PCPCreditCardTokenizer.create(config);

    expect(getPaymentPageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        allowedCardSchemes: ['visa', 'mastercard', 'amex'],
      }),
    );
  });

  it('should handle iframe config with height as "auto"', async () => {
    const config: Config = {
      iframe: {
        iframeWrapperId: 'payment-IFrame',
        height: 'auto',
        width: 400,
      },
      uiConfig: {},
      locale: 'de_DE',
      submitButton: { selector: '#submit' },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
      mode: 'test',
      token: 'dummy-jwt',
    };

    await PCPCreditCardTokenizer.create(config);

    expect(getPaymentPageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        iframe: expect.objectContaining({
          height: 'auto',
        }),
      }),
    );
  });

  it('should use live mode configuration', async () => {
    const config: Config = {
      iframe: { iframeWrapperId: 'payment-IFrame', height: 400, width: 400 },
      uiConfig: {},
      locale: 'en_US',
      submitButton: { selector: '#submit' },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
      mode: 'live',
      token: 'live-jwt-token',
    };

    await PCPCreditCardTokenizer.create(config);

    expect(getPaymentPageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'live',
        token: 'live-jwt-token',
      }),
    );
  });

  it('should pass complete uiConfig with all styling options', async () => {
    const config: Config = {
      iframe: { iframeWrapperId: 'payment-IFrame', height: 400, width: 400 },
      uiConfig: {
        formBgColor: '#ffffff',
        fieldBgColor: '#f0f0f0',
        fieldBorder: '1px solid #ccc',
        btnBgColor: '#007bff',
        btnTextColor: '#ffffff',
        fieldLabelColor: '#333333',
        fieldTextColor: '#000000',
        inputBorderRadius: '4px',
        fontFamily: 'Arial, sans-serif',
      },
      locale: 'de_DE',
      submitButton: { selector: '#submit' },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
      mode: 'test',
      token: 'dummy-jwt',
    };

    await PCPCreditCardTokenizer.create(config);

    expect(getPaymentPageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        uiConfig: expect.objectContaining({
          formBgColor: '#ffffff',
          fieldBgColor: '#f0f0f0',
          btnBgColor: '#007bff',
          inputBorderRadius: '4px',
        }),
      }),
    );
  });

  it('should pass customIconsConfig to the payment page (v1.4)', async () => {
    const customIconsConfig: CustomIconsConfig = {
      useCustomValidationIcons: true,
      showCardBrandIcons: false,
      successIcon: '/icons/valid.svg',
      errorIcon: '/icons/invalid.svg',
    };
    const config: Config = {
      iframe: { iframeWrapperId: 'payment-IFrame', height: 400, width: 400 },
      locale: 'en_US',
      submitButton: { selector: '#submit' },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
      mode: 'test',
      token: 'dummy-jwt',
      customIconsConfig,
    };

    await PCPCreditCardTokenizer.create(config);

    expect(getPaymentPageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        customIconsConfig: expect.objectContaining({
          useCustomValidationIcons: true,
          showCardBrandIcons: false,
          successIcon: '/icons/valid.svg',
          errorIcon: '/icons/invalid.svg',
        }),
      }),
    );
  });

  it('should pass showCardholderName and email to the payment page (v1.4)', async () => {
    const config: Config = {
      iframe: { iframeWrapperId: 'payment-IFrame', height: 400, width: 400 },
      locale: 'en_US',
      submitButton: { selector: '#submit' },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
      mode: 'test',
      token: 'dummy-jwt',
      showCardholderName: true,
      email: 'test@example.com',
    };

    await PCPCreditCardTokenizer.create(config);

    expect(getPaymentPageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        showCardholderName: true,
        email: 'test@example.com',
      }),
    );
  });

  it('should pass CTPConfig to the payment page (v1.4)', async () => {
    const ctpConfig: CTPConfig = {
      enableCTP: true,
      enableCustomerOnboarding: true,
      schemeConfig: {
        merchantPresentationName: 'TestMerchant',
        visaConfig: {
          srcInitiatorId: 'visa-initiator-uuid',
          srcDpaId: 'visa-dpa-uuid',
          encryptionKey: 'enc-key',
          nModulus: 'modulus',
        },
        mastercardConfig: {
          srcInitiatorId: 'mc-initiator-uuid',
          srcDpaId: 'mc-dpa-uuid',
        },
      },
      transactionAmount: {
        amount: '1999',
        currencyCode: 'EUR',
      },
      uiConfig: {
        buttonStyle: 'solid',
        buttonAndBadgeColor: '#3B82F6',
        fontFamily: 'Sansation',
      },
    };
    const config: Config = {
      iframe: { iframeWrapperId: 'payment-IFrame', height: 400, width: 400 },
      locale: 'en_US',
      submitButton: { selector: '#submit' },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
      mode: 'test',
      token: 'dummy-jwt',
      CTPConfig: ctpConfig,
    };

    await PCPCreditCardTokenizer.create(config);

    expect(getPaymentPageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        CTPConfig: expect.objectContaining({
          enableCTP: true,
          enableCustomerOnboarding: true,
          transactionAmount: expect.objectContaining({
            amount: '1999',
            currencyCode: 'EUR',
          }),
          schemeConfig: expect.objectContaining({
            merchantPresentationName: 'TestMerchant',
            visaConfig: expect.objectContaining({
              srcInitiatorId: 'visa-initiator-uuid',
            }),
            mastercardConfig: expect.objectContaining({
              srcDpaId: 'mc-dpa-uuid',
            }),
          }),
        }),
      }),
    );
  });

  it('should pass jcb in allowedCardSchemes (v1.2+)', async () => {
    const config: Config = {
      iframe: { iframeWrapperId: 'payment-IFrame', height: 400, width: 400 },
      locale: 'en_US',
      submitButton: { selector: '#submit' },
      tokenizationSuccessCallback: successCallback,
      tokenizationFailureCallback: failureCallback,
      mode: 'test',
      token: 'dummy-jwt',
      allowedCardSchemes: ['visa', 'mastercard', 'amex', 'jcb'],
    };

    await PCPCreditCardTokenizer.create(config);

    expect(getPaymentPageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        allowedCardSchemes: ['visa', 'mastercard', 'amex', 'jcb'],
      }),
    );
  });
});
