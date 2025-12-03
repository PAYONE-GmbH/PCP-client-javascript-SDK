import {
  Config,
  PCPCreditCardTokenizer,
  UIConfig,
} from 'pcp-client-javascript-sdk';

// Example UI config for the new SDK
const uiConfig: UIConfig = {
  formBgColor: '#ffffff',
  fieldBgColor: '#ffffff',
  fieldBorder: '1px solid #8f8f8f',
  fieldOutline: '#da0c1f solid 1px',
  fieldLabelColor: '#333333',
  fieldPlaceholderColor: '#333333',
  fieldTextColor: '#333333',
  fieldErrorCodeColor: '#8f8f8f',
  fontFamily: 'Mozilla Headline',
  fontUrl:
    'https://fonts.googleapis.com/css2?family=Mozilla+Headline:wght@200..700&family=Nata+Sans:wght@100..900&display=swap',
  labelStyle: {
    fontSize: '20px',
    fontWeight: '900',
  },
  inputStyle: {
    fontSize: '20px',
    fontWeight: '900',
  },
  errorValidationStyle: {
    fontSize: '16px',
    fontWeight: 'normal',
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

  const config: Config = {
    iframe: {
      iframeWrapperId: 'payment-IFrame',
      height: 400,
      width: 400,
      zIndex: 9998,
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
    environment: 'test',
    token: jwtToken,
  };

  await PCPCreditCardTokenizer.create(config);
};

init();
