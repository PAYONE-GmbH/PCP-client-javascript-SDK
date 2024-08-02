import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Config, PCPCreditCardTokenizer, Request } from '../index.js';

describe('PCPCreditCardTokenizer', () => {
  let document: Document;
  let window;

  const hostedIframesIsCompleteMockFunction = vi.fn().mockReturnValue(false);
  const hostedIframesCreditCardCheckMockFunction = vi.fn();

  beforeEach(() => {
    const { window: jsdomWindow } = new JSDOM(
      '<!DOCTYPE html><head></head><body><div id="cardpan"></div><div id="cardcvc2"></div><div id="cardexpiremonth"></div><div id="cardexpireyear"></div></body>',
      {
        url: 'http://localhost',
      },
    );
    document = jsdomWindow.document;
    window = jsdomWindow as unknown as Window & typeof globalThis;
    global.document = document;
    global.window = window;

    // create button elements for submit and submitWithOutCompleteCheck
    const submitButton = document.createElement('button');
    submitButton.id = 'submit';
    document.body.appendChild(submitButton);
    const submitButtonWithOutCompleteCheck = document.createElement('button');
    submitButtonWithOutCompleteCheck.id = 'submitWithOutCompleteCheck';
    document.body.appendChild(submitButtonWithOutCompleteCheck);

    // create cc-icons container
    const ccIcons = document.createElement('div');
    ccIcons.id = 'cc-icons';
    document.body.appendChild(ccIcons);

    // mock the new window.Payone.ClientApi.HostedIFrames function
    const hostedIframesMockFunction = vi.fn();
    window!.Payone = {
      ClientApi: {
        HostedIFrames: hostedIframesMockFunction.mockReturnValue({
          isComplete: hostedIframesIsCompleteMockFunction,
          creditCardCheck: hostedIframesCreditCardCheckMockFunction,
        }),
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const autoCardTypeDetectionCallbackFn = vi.fn();
  const creditcardcheckCallbackFn = vi.fn();
  const formNotCompleteCallbackFn = vi.fn();
  const mockPmiPortalKey = 'mockPmiPortalKey';

  const mockRequest: Request = {
    request: 'creditcardcheck',
    responsetype: 'JSON',
    mode: 'test',
    mid: 'mockMID',
    aid: 'mockAID',
    portalid: 'mockPortalId',
    encoding: 'UTF-8',
    storecarddata: 'yes',
    api_version: '3.11',
  };

  const mockConfig: Config = {
    fields: {
      cardpan: {
        selector: 'cardpan',
        type: 'input',
      },
      cardcvc2: {
        selector: 'cardcvc2',
        type: 'password',
        size: '4',
        maxlength: '4',
        length: { V: 3, M: 3 },
      },
      cardexpiremonth: {
        selector: 'cardexpiremonth',
        type: 'text',
        size: '2',
        maxlength: '2',
        iframe: {
          width: '60px',
        },
      },
      cardexpireyear: {
        selector: 'cardexpireyear',
        type: 'text',
        iframe: {},
      },
    },
    defaultStyle: {
      input: '',
      inputFocus: '',
      select: '',
      iframe: {},
    },
    autoCardtypeDetection: {
      supportedCardtypes: ['V', 'M', 'A', 'D', 'J'],
      callback: autoCardTypeDetectionCallbackFn,
    },
    language: 'de',
    submitButton: {
      selector: '#submit',
    },
    submitButtonWithOutCompleteCheck: {
      selector: '#submitWithOutCompleteCheck',
    },
    ccIcons: {
      selector: '#cc-icons',
      mapCardtypeToSelector: {
        V: '#visa',
        M: '#mastercard',
        A: '#american-express',
        D: '#diners-club',
        J: '#jcb',
      },
      style: {
        width: '50px',
        margin: '0 10px',
      },
    },
    creditCardCheckCallback: creditcardcheckCallbackFn,
    formNotCompleteCallback: formNotCompleteCallbackFn,
  };

  describe('given a valid config', () => {
    beforeEach(async () => {
      setTimeout(() => {
        const scriptElement = document.querySelector('#payone-hosted-script');
        scriptElement!.dispatchEvent(new Event('load'));
      }, 0);
      await PCPCreditCardTokenizer.create(
        mockConfig,
        mockRequest,
        mockPmiPortalKey,
      );
    });

    it('should call the creditCardCheck function when the submit button is clicked', async () => {
      hostedIframesIsCompleteMockFunction.mockReturnValueOnce(true);

      const submitButton = document.querySelector(
        mockConfig.submitButton.selector as string,
      ) as HTMLButtonElement;
      submitButton.click();

      expect(hostedIframesIsCompleteMockFunction).toHaveBeenCalledOnce();
      expect(hostedIframesCreditCardCheckMockFunction).toHaveBeenCalledWith(
        'payCallback',
      );
    });

    it('should throw an error if the creditCardCheck function is called before the hosted iframes are complete', async () => {
      hostedIframesIsCompleteMockFunction.mockReturnValueOnce(false);

      const submitButton = document.querySelector(
        mockConfig.submitButton.selector as string,
      ) as HTMLButtonElement;
      submitButton.click();

      expect(hostedIframesIsCompleteMockFunction).toHaveBeenCalledOnce();
      expect(hostedIframesCreditCardCheckMockFunction).not.toHaveBeenCalled();
      expect(formNotCompleteCallbackFn).toHaveBeenCalled();
    });

    it('should call the creditCardCheck function when the submitWithOutCompleteCheck button is clicked', async () => {
      hostedIframesIsCompleteMockFunction.mockReturnValueOnce(true);

      const submitWithOutCompleteCheck = document.querySelector(
        mockConfig.submitButtonWithOutCompleteCheck?.selector as string,
      ) as HTMLButtonElement;
      submitWithOutCompleteCheck.click();

      expect(hostedIframesIsCompleteMockFunction).not.toHaveBeenCalled();
      expect(hostedIframesCreditCardCheckMockFunction).toHaveBeenCalledWith(
        'payCallback',
      );
    });

    it('should call the creditCardCheckCallback when the window.payCallback function is called', async () => {
      window!.payCallback({
        status: 'VALID',
        pseudocardpan: 'mockPseudoCardPan',
        truncatedcardpan: 'mockTruncatedCardPan',
        cardtype: 'mockCardType',
        cardexpiredate: 'mockCardExpireDate',
      });

      expect(creditcardcheckCallbackFn).toHaveBeenCalledWith({
        status: 'VALID',
        pseudocardpan: 'mockPseudoCardPan',
        truncatedcardpan: 'mockTruncatedCardPan',
        cardtype: 'mockCardType',
        cardexpiredate: 'mockCardExpireDate',
      });
    });

    it('wont load the script if it is already loaded', async () => {
      document.body.innerHTML += '<script id="payone-hosted-script"></script>';

      const tokenizer = await PCPCreditCardTokenizer.create(
        mockConfig,
        mockRequest,
        mockPmiPortalKey,
      );

      expect(tokenizer).toBeDefined();
    });
  });

  describe('given an invalid config', () => {
    it('should throw an error if the submit button is not found.', async () => {
      const invalidConfig = {
        ...mockConfig,
        submitButton: {
          selector: '#invalid-selector',
        },
      };
      expect(
        async () =>
          await PCPCreditCardTokenizer.create(
            invalidConfig,
            mockRequest,
            mockPmiPortalKey,
          ),
      ).rejects.toThrow(
        'Submit Button not present. Please provide a valid selector or element.',
      );
    });

    it('should throw an error if the given cc-icons container is not found.', async () => {
      const invalidConfig = {
        ...mockConfig,
        ccIcons: {
          ...mockConfig.ccIcons,
          selector: '#invalid-selector',
        },
      };
      expect(
        async () =>
          await PCPCreditCardTokenizer.create(
            invalidConfig,
            mockRequest,
            mockPmiPortalKey,
          ),
      ).rejects.toThrow(
        'Container for Credit Card Icons not present. Please provide a valid selector or element',
      );
    });
  });
});
