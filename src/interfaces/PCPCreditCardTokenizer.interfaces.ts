/**
 * Attributes and values in object "config.fields"
 */
export interface FieldConfig {
  /**
   * Name of your div-container id, e.g. "cardpan".
   * Either "selector" or "element" is required.
   */
  selector?: string;
  /**
   * Javascript Element of the div-container, e.g. "document.getElementById("cardpan")"
   * Either " element" or "selector" is required.
   */
  element?: HTMLElement;
  /**
   * Size of input field in characters, e.g. "20"
   */
  size?: string;
  /**
   * Maximum length of accepted input, e.g. "20"
   */
  maxlength?: string;
  /**
   * Array of exact length of accepted input per CC-type
   * e.g.: length: { "A": 4, "V": 3, "M": 3, "J": 0 }
   * While optional, we strongly recommend using the "length" parameter so the enforced CVC length corresponds to the selected card type.
   */
  length?: { [key: string]: number };
  /**
   * Define type of input field:
   * "text" -> input is visible
   * "tel" -> input is visible, simple keyboard is displayed on mobile devices
   * "password" -> input is masked
   * "select" -> display selection/drop-down with possible values (only valid for month and year)
   */
  type: string;
  /**
   * CSS  style properties for not-focused element, e.g.
   * "font-size: 1em; border: 1px solid #000; background: white; color: red;
   * width: 145px; height: 70px; font-family: 'Courier'; font-style: italic;
   * font-weight: bold; text-align: center; letter-spacing: 2px;"
   *
   * Remark:
   * You may use any CSS style property except "url".
   * If "url" is used the style will be ignored as PCI DSS does not allow external ressources.
   * These characters must not be used: "\", "/", "?", "<" and ">"
   * "styleFocus" overwrites "style"
   */
  style?: string;
  /**
   * CSS  style properties for not-focused element, e.g.
   * "font-size: 1em; border: 1px solid #000; background: white; color: red;
   * width: 145px; height: 70px; font-family: 'Courier'; font-style: italic;
   * font-weight: bold; text-align: center; letter-spacing: 2px;"
   *
   * Remark:
   * You may use any CSS style property except "url".
   * If "url" is used the style will be ignored as PCI DSS does not allow external ressources.
   * These characters must not be used: "\", "/", "?", "<" and ">"
   * "styleFocus" overwrites "style"
   */
  styleFocus?: string;
  /**
   * Size, e.g.:
   * iframe: {
   *    height: "25px",
   *    width: "250px"
   * }
   */
  iframe?: { width?: string; height?: string };
}

/**
 * Attributes and values in object "config.fields.cardtype"
 */
export interface CardtypeFieldConfig {
  /**
   * Name of your div-container id, e.g. "cardtype".
   * Either "selector" or "element" is required.
   */
  selector?: string;
  /**
   * Javascript Element of the div-container, e.g. "document.getElementById("cardtype")"
   * Either " element" or "selector" is required.
   */
  element?: HTMLElement;
  /**
   * Define possible cardtypes for selection in PAYONE iFrame, e.g. ["V", "M", "A"].
   * New cardtype "#" has been implemented to enforce user selection and display "Please select" initially. If used, it should be the first element of the array.
   */
  cardtypes: string[];
}

/**
 * Attributes and values in object "config.defaultStyle"
 */
export interface Style {
  /**
   * CSS style properties for input fields,
   * e.g. "font-size: 1em; border: 1px solid #000; width: 175px;"
   */
  input: string;
  /**
   * CSS style properties for focused input fields (overwrites “input”),
   * e.g. "font-size: 1em; border: 1px solid #000; width: 175px;"
   */
  inputFocus: string;
  /**
   * CSS style properties for focused select fields (overwrites “select”),
   * e.g. "font-size: 1em; border: 1px solid #000;"
   */
  select: string;
  /**
   * Size in pixel, e.g.:
   * iframe {
   *    height: "25px",
   *    width: "250px"
   * }
   */
  iframe: {
    height?: string;
    width?: string;
  };
}

/**
 * Attributes and values in object "config.autoCardtypeDetection"
 */
export interface AutoCardtypeDetection {
  /**
   * Define possible cardtypes that should be accepted by automatic detection, e.g. ["V", "M", "A"]
   */
  supportedCardtypes: string[];
  /**
   * Define a function that is used as a callback-function if result of automatic cardtype detection changes. Detection starts after first 6 digits of the PAN – this is the BIN (Bank Identification Number) of a credit card and the official id for cardtype and origin detection.
   * This callback-function can be used to change highlighting of logos for selected / detected cardtypes.
   * Possible result codes in callback-function:
   *
   * "A", "D", "J", "M", "O", "P", "V", "U" -> cardtype
   *
   * "?" -> Cardtype not automatically detected
   *
   * "-" -> Cardtype automatically detected, but not allowed because not in array supportedCardtypes
   *
   * Further cardtypes may be added in future.
   * @param {string} resultCode
   */
  callback: (resultCode: string) => void;
  /**
   * Define if automatic cardtype detection should be deactivated, default is false
   */
  deactivate?: boolean;
}

/**
 *  Attributes and values in object "request"
 */
export interface Request {
  /**
   * fixed value: 'creditcardcheck'
   */
  request: string;
  /**
   * fixed value: 'JSON'
   */
  responsetype: string;
  /**
   * fixed value: 'yes'
   */
  storecarddata: string;
  /**
   * mode for transactions, either 'live' or 'test'
   */
  mode: string;
  /**
   * your encoding, either 'ISO-8859-1' or 'UTF-8'
   */
  encoding: string;
  /**
   * your Merchant ID
   */
  mid: string;
  /**
   * your Account ID
   */
  aid: string;
  /**
   * your Portal ID
   */
  portalid: string;
  /**
   * optional configuration - valid for Deutsche Bahn only
   * Fixed value "TC" -> starting "creditcardcheck with travel cards"
   */
  checktype?: string;
  /**
   * sha2_384 hash over request values (alphabetical order) plus portal key in your PMI portal configuration.
   * e.g.:
   *    - aid: '10002', // your AID
   *    - encoding: 'UTF-8', // desired encoding
   *    - mid: '10001', // your MID
   *    - mode: 'live', // desired mode
   *    - portalid: '2000002', // your PortalId
   *    - request: 'creditcardcheck', // fixed value
   *    - responsetype: 'JSON', // fixed value
   *    - storecarddata: 'yes', // fixed value
   *    - PMI Portal key: '123456'
   *
   * hash_hmac("sha384", "10002UTF-810001live2000002creditcardcheckJSONyes", "123456")
   * =1cf456bf692453613ebb992a3fb859cc347ddc7e94e2ca764efbe8b0089de6964ab1266df0831e59de89dc5291070fe7
   */
  hash?: string;
  /**
   * fixed value: '3.11'
   */
  api_version: string;
}

export interface SubmitButtonConfig {
  /**
   * Name of your container selector, e.g. "#submit".
   * Either "selector" or "element" is required.
   */
  selector?: string;
  /**
   * Javascript Element of the container, e.g. "document.getElementById("submitButton")"
   */
  element?: HTMLElement;
}

export interface CreditCardIconsConfig {
  /**
   * Name of your container selector, e.g. "#cc-icons".
   * Either "selector" or "element" is required.
   */
  selector?: string;
  /**
   * Javascript Element of the container, e.g. "document.getElementById("cc-icons")"
   */
  element?: HTMLElement;
  /**
   * Map cardtype to selector, e.g. { "V": "#visa", "M": "#mastercard" }
   */
  mapCardtypeToSelector?: Partial<Record<Cardtype, string>>;
  /**
   * CSS style properties for credit card icons, e.g.
   * {
   *     height: "25px", width: "50px", margin: "0 10px", ...
   * }
   */
  style?: {
    [key: string]: string | undefined;
    height?: string;
    width?: string;
  };
}

export interface Config {
  fields: {
    cardtype?: CardtypeFieldConfig;
    cardpan: FieldConfig;
    cardcvc2: FieldConfig;
    cardexpiremonth: FieldConfig;
    cardexpireyear: FieldConfig;
  };
  defaultStyle: Style;
  autoCardtypeDetection: AutoCardtypeDetection;
  language: string;
  submitButton: SubmitButtonConfig;
  submitButtonWithOutCompleteCheck?: SubmitButtonConfig;
  ccIcons?: CreditCardIconsConfig;
  /**
   * The value for attribute "error" refers to the name of your div-container where error-messages should be displayed.
   */
  error?: string;

  /**
   * Define a callback function that is called after the credit card check has been completed. The function receives the response object as a parameter.
   * The response object contains either:
   *    - response.status = "VALID"
   *    - response.pseudocardpan containing the unique pseudocardnumber (Pseudo-PAN)
   *    - response.truncatedcardpan containing the masked creditcard number (masked PAN)
   *    - response.cardtype containing the selected cardtype
   *    - response. cardexpiredate containing the entered expiredate (YYMM)
   *
   * or
   *    - response.status = "INVALID"
   *    - response.errorcode -> please refer to the section "error messages"
   *    - response.errormessage in the specified language
   * @param {Object} response - Object containing the response of the credit card check
   */
  creditCardCheckCallback: (response: {
    [key: string]: string;
    status: string;
    pseudocardpan: string;
    truncatedcardpan: string;
    cardtype: string;
    cardexpiredate: string;
  }) => void;
  /**
   * Define a callback function that is called after the form has been submitted by the normal submit button and the form is not complete.
   */
  formNotCompleteCallback?: () => void;
  /**
   * Define an ID for the PAYONE script to be loaded. If not set, a default ID (payone-hosted-script) will be used.
   */
  payOneScriptId?: string;
}

/**
 * Cardtype values
 * - V = VISA
 * - M = Mastercard
 * - A = American Express
 * - D = Diners Club / Discover
 * - J = JCB
 * - O = Maestro International
 * - P = China Union Pay
 * - U = UATP / Airplus
 * - G = girocard
 *
 * *girocard is currently only viable for e-commerce-payments via Apple Pay.
 */
export type Cardtype = 'V' | 'M' | 'A' | 'D' | 'J' | 'O' | 'P' | 'U' | 'G';
