import { PCPFingerprintingTokenizer } from 'pcp-client-javascript-sdk';

const init = async () => {
  // make sure to get this ids from your server
  const paylaPartnerTestId = 'e7yeryF2of8X';
  const partnerMerchantTestId = 'test-1';

  const fingerprintingTokenizer = await PCPFingerprintingTokenizer.create(
    'body',
    't',
    paylaPartnerTestId,
    partnerMerchantTestId,
  );

  const snippetToken = fingerprintingTokenizer.getSnippetToken();
  console.log('snippetToken: ', snippetToken);
};

init();
