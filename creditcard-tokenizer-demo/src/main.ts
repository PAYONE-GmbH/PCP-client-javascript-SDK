import { Config, PCPCreditCardTokenizer } from 'pcp-client-javascript-sdk';

// Example UI config for the new SDK
const uiConfig = {
  formBgColor: '#64bbb7',
  fieldBgColor: 'wheat',
  fieldBorder: '1px solid #b33cd8',
  fieldOutline: '#101010 solid 5px',
  fieldLabelColor: '#d3d83c',
  fieldPlaceholderColor: 'blue',
  fieldTextColor: 'crimson',
  fieldErrorCodeColor: 'green',
};

const config: Config = {
  iframe: {
    iframeWrapperId: 'payment-IFrame',
    height: 400,
    width: 400,
  },
  uiConfig,
  locale: 'de_DE',
  submitButton: {
    selector: '#submit',
  },
  tokenizationSuccessCallback: (statusCode, token, cardDetails) => {
    console.log('Tokenized card successfully');
    console.log('Status:', statusCode);
    console.log('Token:', token);
    console.log('Card Details:', cardDetails);
  },
  tokenizationFailureCallback: (statusCode, errorResponse) => {
    console.error('Tokenization of card failed');
    console.error('Status:', statusCode);
    console.error('Error:', errorResponse.error);
  },
};

// You must fetch the JWT from your backend before initializing the SDK.
const fetchJwtToken = async (): Promise<string> => {
  // Please start one of the Server SDKs or use the /v1/{merchantId}/authenticatin-token Endpoint directly to get the JWT token.
  // Then return the actual token in the next line to test this example.
  return '<Token to be retrieved from the CommercePlatform-API>';
};

const init = async () => {
  const jwtToken = await fetchJwtToken();
  await PCPCreditCardTokenizer.create(config, jwtToken);
};

init();
