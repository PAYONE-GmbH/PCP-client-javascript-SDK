import {
  Config,
  PCPCreditCardCheck,
  Request,
  createHash,
} from 'pcp-client-javascript-sdk';
import './style.css';

const pmiPortalKey = '';

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
  mid: '', // your MID
  aid: '', // your AID
  portalid: '', // your PortalId
  encoding: 'UTF-8', // desired encoding
  storecarddata: 'yes', // fixed value
};

const init = async () => {
  const hash = await createHash(requestWithoutHash, pmiPortalKey);

  console.log('hash: ', hash);

  const request: Request = {
    ...requestWithoutHash,
    hash,
  };

  new PCPCreditCardCheck(config, request, pmiPortalKey);
};

init();
