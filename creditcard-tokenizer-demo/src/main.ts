import {
  Cardtype,
  Config,
  PCPCreditCardTokenizer,
  Request,
} from 'pcp-client-javascript-sdk';

const supportedCardtypes = import.meta.env.VITE_PAYONE_CC_TYPES.split(
  ',',
) as Cardtype[];

const getCardtypeSelector = (cardtype: Cardtype) => {
  switch (cardtype) {
    case 'V':
      return '#visa';
    case 'M':
      return '#mastercard';
    case 'A':
      return '#american-express';
    case 'D':
      return '#diners-club';
    case 'J':
      return '#jcb';
    default:
      throw new Error(`Unsupported card type: ${cardtype}`);
  }
};

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
          margin-top: 6px;
       `;

const config: Config = {
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
      length: { V: 3, M: 3 }, // enforce 3 digit CVC für VISA and Mastercard
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
    input: inputStyle,
    inputFocus: inputStyle,
    select: 'font-size: 1em; border: 1px solid #000;',
    iframe: {},
  },
  autoCardtypeDetection: {
    supportedCardtypes,
    callback: function (detectedCT: string) {
      const detectedCardtype = detectedCT as Cardtype;

      // For the output container below.
      document.getElementById('autodetectionResponsePre')!.innerHTML =
        detectedCardtype;

      const cardtypeIconSelector = Object.values(
        config.ccIcons?.mapCardtypeToSelector ?? [],
      );

      // comma separated list of all card icon selectors
      const allCardtypeIconSelectors = cardtypeIconSelector
        .map((selector) => `img[cc-selector="${selector}"]`)
        .join(', ');

      // Reset all card type icon borders
      document.querySelectorAll(allCardtypeIconSelectors).forEach((el) => {
        (el as HTMLElement).style.borderColor = '#FFF';
      });

      // Set border color of detected card type icon to blue
      (
        document.querySelector(
          `img[cc-selector="${getCardtypeSelector(detectedCardtype)}"]`,
        ) as HTMLElement
      ).style.borderColor = '#00F';
    },
    // deactivate: true // To turn off automatic card type detection.
  },
  language: 'de',
  submitButtonId: 'submit',
  submitButtonWithOutCompleteCheckId: 'submitWithOutCompleteCheck',
  ccIcons: {
    selector: '#cc-icons',
    mapCardtypeToSelector: supportedCardtypes.reduce(
      (acc, cardtype) => ({
        ...acc,
        [cardtype]: getCardtypeSelector(cardtype),
      }),
      {} as Record<Cardtype, string>,
    ),
    style: {
      width: '50px',
      margin: '0 10px',
      border: '2px solid #FFF',
      'border-radius': '4px',
      padding: '4px',
    },
  },
  creditCardCheckCallback: (response) => {
    console.log('Credit Card Check Response:', response);

    // For the output container below.
    if (typeof response === 'object') {
      let responseAsString = 'time: ' + new Date().getTime() + '\n';
      for (const key in response) {
        if (Object.hasOwnProperty.call(response, key)) {
          responseAsString += key + ': ' + response[key] + '\n';
        }
      }
      document.getElementById('jsonResponsePre')!.innerHTML = responseAsString;
    }
  },
  error: 'error',
};

const request: Request = {
  request: 'creditcardcheck', // fixed value
  responsetype: 'JSON', // fixed value
  mode: 'test', // desired mode
  mid: import.meta.env.VITE_PAYONE_MERCHANT_ID, // your MID
  aid: import.meta.env.VITE_PAYONE_SUBACCOUNT_ID, // your AID
  portalid: import.meta.env.VITE_PAYONE_PORTAL_ID, // your PortalId
  encoding: 'UTF-8', // desired encoding
  storecarddata: 'yes', // fixed value
  api_version: '3.11', // fixed value
};
const pmiPortalKey = import.meta.env.VITE_PAYONE_PMI_KEY; // your PMI Portal Key

const init = async () => {
  // Credit Card Tokenizer Demo
  PCPCreditCardTokenizer.create(config, request, pmiPortalKey);
};

init();
