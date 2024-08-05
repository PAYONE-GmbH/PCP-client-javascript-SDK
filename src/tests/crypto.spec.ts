import nodeCrypto from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { Request } from '../interfaces/index.js';
import { createHash } from '../lib/crypto.js';

describe('crypto', () => {
  beforeAll(() => {
    Object.defineProperty(global, 'crypto', {
      value: nodeCrypto,
      writable: true,
    });
  });
  describe('createHash', () => {
    it('should create a hash', async () => {
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
      const pmiPortalKey = 'wurstbrot';

      const expectedResultForAboveValues =
        'ba5c08f0a3ee380214908e1274411227054923d129109e6f4b4460935a64918e5871842655ea8c02e54fcafa9c029bc0';

      const hash = await createHash(requestWithoutHash, pmiPortalKey);

      expect(hash).toBeTruthy();
      expect(hash).toEqual(expectedResultForAboveValues);
    });
  });
});
