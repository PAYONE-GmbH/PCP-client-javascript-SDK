import { describe, expect, it } from '@jest/globals';
import { Request, createHash } from '../lib/crypto';

describe('crypto', () => {
  describe('createHash', () => {
    it('should create a hash', async () => {
      const requestWithoutHash: Omit<Request, 'hash'> = {
        request: 'creditcardcheck',
        responsetype: 'JSON',
        mode: 'test',
        mid: '99999',
        aid: '99998',
        portalid: '7777777',
        encoding: 'UTF-8',
        storecarddata: 'yes',
      };
      const pmiPortalKey = 'wurstbrot';

      const hash = await createHash(requestWithoutHash, pmiPortalKey);

      expect(hash).toBeTruthy();
    });
  });
});
