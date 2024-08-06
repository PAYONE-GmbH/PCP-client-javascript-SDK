import { PCPFingerprintingTokenizer } from 'pcp-client-javascript-sdk';

const init = async () => {
  const fingerprintingTokenizer = await PCPFingerprintingTokenizer.create(
    'body',
    't',
    import.meta.env.VITE_PAYLA_PARTNER_ID,
    import.meta.env.VITE_PARTNER_MERCHANT_ID,
  );

  const snippetToken = fingerprintingTokenizer.getSnippetToken();
  console.log('snippetToken: ', snippetToken);
};

init();
