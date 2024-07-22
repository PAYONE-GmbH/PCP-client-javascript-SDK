import {
  ApplePayButton,
  Config,
  PCPApplePaySession,
  PCPApplePaySessionConfig,
  PCPCreditCardTokenizer,
  PCPFingerprintingTokenizer,
  Request,
  createHash,
} from 'pcp-client-javascript-sdk';

const inputStyle = `
          min-height: 38px;
          padding: 8px;
          font-size: 13px;
          border-radius: 19px;
          border: 2px solid #0078AB;
          width: 100%;
          max-width: 180px;
          box-sizing: border-box;
          text-align: left;
          margin: 4px;
       `;

const config: Config = {
  fields: {
    cardpan: {
      selector: 'cardpan',
      type: 'input',
    },
    cardcvc2: {
      selector: 'cardcvc2',
      type: 'password', // Could be "text" as well.
      size: '4',
      maxlength: '4',
      length: { V: 3, M: 3 }, // enforce 3 digit CVC für VISA and Mastercard
    },
    cardexpiremonth: {
      selector: 'cardexpiremonth',
      type: 'text', // select (default), text, tel
      size: '2',
      maxlength: '2',
      style: inputStyle + 'width: 40px;',
      styleFocus: inputStyle + 'width: 40px;',
      iframe: {
        width: '48px',
      },
    },
    cardexpireyear: {
      selector: 'cardexpireyear',
      type: 'text', // select (default), text, tel
      style: inputStyle + 'width: 60px;',
      styleFocus: inputStyle + 'width: 60px;',
      iframe: {
        width: '68px',
      },
    },
  },
  defaultStyle: {
    input: inputStyle,
    inputFocus: inputStyle,
    select: 'font-size: 1em; border: 1px solid #000;',
    iframe: {
      height: '48px',
      width: '200px',
    },
  },
  autoCardtypeDetection: {
    supportedCardtypes: ['V', 'M'],
    callback: function (detectedCardtype: string) {
      // For the output container below.
      document.getElementById('autodetectionResponsePre')!.innerHTML =
        detectedCardtype;

      if (detectedCardtype === 'V') {
        document.getElementById('visa')!.style.borderColor = '#00F';
        document.getElementById('mastercard')!.style.borderColor = '#FFF';
      } else if (detectedCardtype === 'M') {
        document.getElementById('visa')!.style.borderColor = '#FFF';
        document.getElementById('mastercard')!.style.borderColor = '#00F';
      } else {
        document.getElementById('visa')!.style.borderColor = '#FFF';
        document.getElementById('mastercard')!.style.borderColor = '#FFF';
      }
    }, //,
    // deactivate: true // To turn off automatic card type detection.
  },
  language: 'de',
};

const requestWithoutHash: Omit<Request, 'hash'> = {
  request: 'creditcardcheck', // fixed value
  responsetype: 'JSON', // fixed value
  mode: 'test', // desired mode
  mid: '18352', // your MID
  aid: '18353', // your AID
  portalid: '2013244', // your PortalId
  encoding: 'UTF-8', // desired encoding
  storecarddata: 'yes', // fixed value
  api_version: '3.11', // fixed value
};

const init = async () => {
  // Test for getting the token for credit card tokenization via the SDKs PCPCreditCardTokenizer
  const pmiPortalKey = 'FtRWy06i9F!%^42W$t&Z#t@qXArkZ!';

  const hash = await createHash(requestWithoutHash, pmiPortalKey);

  console.log('hash: ', hash);

  const request: Request = {
    ...requestWithoutHash,
    hash,
  };

  new PCPCreditCardTokenizer(config, request, pmiPortalKey);

  // Test for getting the token for fingerprinting via the SDKs PCPFingerprintingTokenizer
  const paylaPartnerTestId = 'e7yeryF2of8X';
  const partnerMerchantTestId = 'test-1';

  const fingerprintingTokenizer = new PCPFingerprintingTokenizer(
    'body',
    't',
    paylaPartnerTestId,
    partnerMerchantTestId,
  );

  const div = document.createElement('div');
  div.style.width = '200px';
  div.style.height = '100px';
  div.style.backgroundColor = 'red';
  div.style.color = 'white';
  div.style.display = 'flex';
  div.style.justifyContent = 'center';
  div.style.alignItems = 'center';
  div.style.cursor = 'pointer';
  div.innerHTML = 'Get FP Token for BNPL!';
  div.onclick = async () => {
    console.log(
      'fp token: ',
      await fingerprintingTokenizer.getFingerprintToken(),
    );
  };
  document.body.appendChild(div);

  const applePaySessionConfig: PCPApplePaySessionConfig = {
    countryCode: 'DE',
    currencyCode: 'EUR',
    merchantCapabilities: [
      'supports3DS', // mandatory
    ],
    supportedNetworks: ['visa', 'masterCard', 'amex', 'girocard'],
    total: {
      label: 'Demo (Card is not charged)',
      type: 'final',
      amount: '1.99',
    },
    validateMerchantURL:
      'https://payone-apple-pay-demo-server.nanogiants-services.de/validate-merchant',
    processPaymentURL:
      'https://payone-apple-pay-demo-server.nanogiants-services.de/process-payment',
    merchantValidationData: {
      merchantIdentifier: 'merchant.com.nanogiants.payone',
      foo: 'bar',
    },
    paymentMethodSelectedCallback: async (paymentMethod) => {
      console.log('paymentMethodSelectedCallback', paymentMethod);
      return {
        newTotal: {
          label: 'Demo (Card is not charged)',
          type: 'final',
          amount: '1.99',
        },
      };
    },
    couponCodeChangedCallback: async (couponCode) => {
      console.log('couponCodeChangedCallback', couponCode);
      return {
        newTotal: {
          label: 'Demo (Card is not charged)',
          type: 'final',
          amount: '1.99',
        },
      };
    },
    shippingMethodSelectedCallback: async (shippingMethod) => {
      console.log('shippingMethodSelectedCallback', shippingMethod);
      return {
        newTotal: {
          label: 'Demo (Card is not charged)',
          type: 'final',
          amount: '1.99',
        },
      };
    },
    shippingContactAddressSelectedCallback: async (shippingContact) => {
      console.log('shippingContactAddressSelectedCallback', shippingContact);
      return {
        newTotal: {
          label: 'Demo (Card is not charged)',
          type: 'final',
          amount: '1.99',
        },
      };
    },
    cancelCallback: () => {
      console.log('cancelCallback');
    },
  };

  const applePayButton: ApplePayButton = {
    selector: '#apple-pay-button',
    config: {
      buttonstyle: 'black',
      type: 'plain',
      locale: 'de-DE',
    },
  };

  new PCPApplePaySession(applePaySessionConfig, applePayButton);
};

init();
