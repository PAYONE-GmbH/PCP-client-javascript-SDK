import nodeCrypto from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { Request } from '../interfaces/index.js';
import { createHash, encodeToBase64 } from '../lib/crypto.js';

describe('crypto', () => {
  beforeAll(() => {
    Object.defineProperty(global, 'crypto', {
      value: nodeCrypto,
      writable: true,
    });
  });
  describe('createHash', () => {
    const requestWithoutHash: Omit<Request, 'hash'> = {
      request: 'creditcardcheck',
      responsetype: 'JSON',
      mode: 'test',
      mid: '11111',
      aid: '22222',
      portalid: '3333333',
      encoding: 'UTF-8',
      storecarddata: 'yes',
      api_version: '3.11',
    };
    const pmiPortalKey = 'secretTestKey';
    it('should create a correct hash', async () => {
      const expectedResultForAboveValues =
        '72a4a5acd535aa5eb87bee93f288b8016fb44134767a36d323dafe2105f491bc555e47d7e2cdc1ee6f291f0999e30d68';

      const hash = await createHash(requestWithoutHash, pmiPortalKey);

      expect(hash).toBeTruthy();
      expect(hash).toEqual(expectedResultForAboveValues);
    });

    it('should create a correct hash with checktype', async () => {
      const requestWithChecktype: Omit<Request, 'hash'> = {
        ...requestWithoutHash,
        checktype: 'TC',
      };
      const expectedResultForAboveValues =
        'cef6c7de0867328e46adc13da9435a9a37825b9822452fc745b745154a2129d775a820deffcaae022b7259f17aafd36e';

      const hash = await createHash(requestWithChecktype, pmiPortalKey);

      expect(hash).toBeTruthy();
      expect(hash).toEqual(expectedResultForAboveValues);
    });
  });

  describe('encodeToBase64', () => {
    it('should encode an ascii string to base64', () => {
      const asciiString = 'Hello, World!';
      const expectedResult = 'SGVsbG8sIFdvcmxkIQ==';

      const base64String = encodeToBase64(asciiString);

      expect(base64String).toBeTruthy();
      expect(base64String).toEqual(expectedResult);
    });

    it('should encode a utf-8 string to base64', () => {
      const utf8String = '👋🌍';
      const expectedResult = '8J+Ri/CfjI0=';

      const base64String = encodeToBase64(utf8String);

      expect(base64String).toBeTruthy();
      expect(base64String).toEqual(expectedResult);
    });
  });
});
