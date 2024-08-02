import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PCPFingerprintingTokenizer } from '../index.js';

describe('PCPFingerprintingTokenizer', () => {
  let document: Document;
  let window;

  const paylaDcsInitMockFn = vi.fn();
  const paylaPartnerId = 'paylaPartnerId';
  const partnerMerchantId = 'partnerMerchantId';

  beforeEach(() => {
    const { window: jsdomWindow } = new JSDOM(
      '<!DOCTYPE html><head></head><body></body>',
      {
        url: 'http://localhost',
      },
    );
    document = jsdomWindow.document;
    window = jsdomWindow as unknown as Window & typeof globalThis;
    global.document = document;
    global.window = window;

    const selector = document.createElement('div');
    selector.id = 'mock-selector';
    document.body.appendChild(selector);

    window!.paylaDcs = {
      init: paylaDcsInitMockFn,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('given a valid config', () => {
    let tokenizer: PCPFingerprintingTokenizer;
    beforeEach(async () => {
      setTimeout(() => {
        const scriptElement = document.querySelector('#paylaDcs');
        scriptElement!.dispatchEvent(new Event('load'));
      }, 0);
      setTimeout(() => {
        const styleSheetElement = document.querySelector('#paylaDcsStylesheet');
        styleSheetElement!.dispatchEvent(new Event('load'));
      }, 100);
      tokenizer = await PCPFingerprintingTokenizer.create(
        '#mock-selector',
        'environment',
        'paylaPartnerId',
        'partnerMerchantId',
      );
    });

    describe('getUniqueId', () => {
      it('should return the uniqueId', async () => {
        expect(tokenizer.getUniqueId()).toBeDefined();
      });
    });

    describe('getSnippetToken', () => {
      it('should return the snippetToken', async () => {
        const uniqueId = tokenizer.getUniqueId();
        const snippetToken = tokenizer.getSnippetToken();
        expect(snippetToken).toEqual(
          `${paylaPartnerId}_${partnerMerchantId}_${uniqueId}`,
        );
      });
    });
  });

  describe('given the scripts are already loaded', () => {
    beforeEach(async () => {
      document.body.innerHTML +=
        '<script id="paylaDcs"></script><link id="paylaDcsStylesheet"></link>';
    });
    it('should not load the script and stylesheet again', async () => {
      expect(
        await PCPFingerprintingTokenizer.create(
          '#mock-selector',
          'environment',
          'paylaPartnerId',
          'partnerMerchantId',
        ),
      ).toBeDefined();
    });
  });

  describe('given the query selector does not exist', () => {
    it('should throw an error', async () => {
      await expect(
        PCPFingerprintingTokenizer.create(
          '#non-existent-selector',
          'environment',
          'paylaPartnerId',
          'partnerMerchantId',
        ),
      ).rejects.toThrow('Selector #non-existent-selector does not exist.');
    });
  });
});
