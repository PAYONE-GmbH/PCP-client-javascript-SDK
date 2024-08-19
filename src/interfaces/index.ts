export * from './PCPCreditCardTokenizer.interfaces.js';
export * from './PCPApplePay.interfaces.js';
/** @description Object containing billing address details */
export interface Address {
  /**
   * @description Second line of street or additional address information such as apartments and suits
   * @example Apartment 203
   */
  additionalInfo?: string;
  /**
   * @description City
   * @example Kiel
   */
  city?: string;
  /**
   * @description ISO 3166-1 alpha-2 country code
   * @example DE
   */
  countryCode?: string;
  /**
   * @description House number
   * @example 3
   */
  houseNumber?: string;
  /**
   * @description State (ISO 3166-2 subdivisions), only if country=US, CA, CN, JP, MX, BR, AR, ID, TH, IN.
   * @example BR
   */
  state?: string;
  /**
   * @description Street name
   * @example Coral Avenue
   */
  street?: string;
  /**
   * @description Zip code
   * @example 12345
   */
  zip?: string;
}

/** @description Object containing personal or shipping address information. */
export interface AddressPersonal {
  /**
   * @description Second line of street or additional address information such as apartments and suits
   * @example Apartment 203
   */
  additionalInfo?: string;
  /**
   * @description City
   * @example Kiel
   */
  city?: string;
  /**
   * @description ISO 3166-1 alpha-2 country code
   * @example DE
   */
  countryCode?: string;
  /**
   * @description House number
   * @example 3
   */
  houseNumber?: string;
  /**
   * @description State (ISO 3166-2 subdivisions), only if country=US, CA, CN, JP, MX, BR, AR, ID, TH, IN.
   * @example MX
   */
  state?: string;
  /**
   * @description Street name
   * @example Coral Avenue
   */
  street?: string;
  /**
   * @description Zip code
   * @example 1234
   */
  zip?: string;
  name?: PersonalName;
}

/**
 * @description Indicates which payment endpoints can be used for the respective Checkout.
 *     The systems offers two alternatives to trigger a payment and consecutive events:
 *     OrderManagementCheckoutActions or the Payment Execution resource.
 *     Both alternatives can be used simultaneously but once one of the Payment Execution endpoints is used the
 *     Order Management endpoints can no longer be used for that Checkout since it is no longer possible to match
 *     payment events to items of the Checkout.
 */
export enum AllowedPaymentActions {
  ORDER_MANAGEMENT = 'ORDER_MANAGEMENT',
  PAYMENT_EXECUTION = 'PAYMENT_EXECUTION',
}

/** @description Object containing amount and ISO currency code attributes */
export interface AmountOfMoney {
  /**
   * Format: int64
   * @description Amount in cents and always having 2 decimals
   * @example 1000
   */
  amount: number;
  /**
   * @description Three-letter ISO currency code representing the currency for the amount
   * @example EUR
   */
  currencyCode: string;
}

/**
 * @description Additional information about the Apple payment data token. This information are needed for checking the validity
 *     of the payment data token before decryption.
 */
export interface ApplePaymentDataTokenInformation {
  version?: ApplePaymentTokenVersion;
  /**
   * @description Detached PKCS #7 signature, Base64 encoded as string. Signature of the payment and header data. The
   *     signature includes the signing certificate, its intermediate CA certificate, and information about the
   *     signing algorithm.
   */
  signature?: string;
  header?: ApplePaymentDataTokenHeaderInformation;
}

/**
 * @description Version information about the payment token. Currently only EC_v1 for ECC-encrypted data is supported.
 * @example EC_V1
 */
export enum ApplePaymentTokenVersion {
  EC_V1 = 'EC_V1',
}

/** @description Additional information about the Apple payment data token header. */
export interface ApplePaymentDataTokenHeaderInformation {
  /** @description A hexadecimal Transaction identifier identifier as a string. */
  transactionId?: string;
  /** @description SHA–256 hash, hex encoded as a string. Hash of the applicationData property of the original PKPaymentRequest object. */
  applicationData?: string;
}

/** @description Contains detailed information on one single error. */
export interface APIError {
  /**
   * @description Error code
   * @example 50001130
   */
  errorCode: string;
  /**
   * @description Category the error belongs to. The category should give an indication of the type of error you are dealing
   *     with. Possible values:
   *     * DIRECT_PLATFORM_ERROR - indicating that a functional error has occurred in the platform.
   *     * PAYMENT_PLATFORM_ERROR - indicating that a functional error has occurred in the payment platform.
   *     * IO_ERROR - indicating that a technical error has occurred within the payment platform or between the
   *     payment platform and third party systems.
   *     * COMMERCE_PLATFORM_ERROR - indicating an error originating from the Commerce Platform.
   *     * COMMERCE_PORTAL_BACKEND_ERROR - indicating an error originating from the Commerce Portal Backend.
   * @example PAYMENT_PLATFORM_ERROR
   */
  category?: string;
  /**
   * Format: int32
   * @description HTTP status code for this error that can be used to determine the type of error
   * @example 404
   */
  httpStatusCode?: number;
  /**
   * @description ID of the error. This is a short human-readable message that briefly describes the error.
   * @example general-error-technical-fault-internal
   */
  id?: string;
  /**
   * @description Human-readable error message that is not meant to be relayed to customer as it might tip off people who are
   *     trying to commit fraud
   * @example Authorisation declined
   */
  message?: string;
  /**
   * @description Returned only if the error relates to a value that was missing or incorrect.
   *
   *     Contains a location path to the value as a JSonata query.
   *
   *     Some common examples:
   *     * a.b selects the value of property b of root property a,
   *     * a[1] selects the first element of the array in root property a,
   *     * a[b='some value'] selects all elements of the array in root property a that have a property b with value
   *     'some value'.
   * @example paymentId
   */
  propertyName?: string;
}

/**
 * @description Determines the type of the authorization that will be used. Allowed values:
 *       * PRE_AUTHORIZATION - The payment creation results in a pre-authorization that is ready for Capture. Pre-
 *     authortizations can be reversed and can be captured within 30 days. The capture amount can be lower than the
 *     authorized amount.
 *       * SALE - The payment creation results in an authorization that is already captured at the moment of approval.
 *
 *     If the parameter is not provided in the request, the default value will be PRE_AUTHORIZATION
 */
export enum AuthorizationMode {
  PRE_AUTHORIZATION = 'PRE_AUTHORIZATION',
  SALE = 'SALE',
}

/** @description Object containing information about the end customer's bank account. */
export interface BankAccountInformation {
  /**
   * @description IBAN of the end customer's bank account.
   *     The IBAN is the International Bank Account Number. It is an internationally agreed format for the BBAN and
   *     includes the ISO country code and two check digits.
   * @example DE02370502990000684712
   */
  iban: string;
  /**
   * @description Account holder of the bank account with the given IBAN.
   *     Does not necessarily have to be the end customer (e.g. joint accounts).
   * @example Max Mustermann
   */
  accountHolder: string;
}

export interface CancelItem {
  /**
   * Format: UUID
   * @description Id of the item to cancel.
   * @example 4f0c512e-f12c-11ec-8ea0-0242ac120002
   */
  id: string;
  /**
   * Format: int64
   * @description Quantity of the units being cancelled, should be greater than zero
   *     Note: Must not be all spaces or all zeros
   * @example 1
   */
  quantity: number;
}

/**
 * @description Reason why an order was cancelled. Possible values:
 *     * CONSUMER_REQUEST - The consumer requested a cancellation of the Order
 *     * UNDELIVERABLE - The merchant cannot fulfill the Order
 *     * DUPLICATE - The Order was created twice accidentally
 *     * FRAUDULENT- Consumer turned out to be a fraudster
 *     * ORDER_SHIPPED_IN_FULL - The merchant shipped everything and wants to cancel the remaining authorized amount of
 *     the Order
 *     * AUTOMATED_SHIPMENT_FAILED - A technical error was thrown during an automated shipment API call rendering the
 *     Order impossible to complete
 *
 *     Mandatory for PAYONE Buy Now, Pay Later (BNPL):
 *     * 3390 - PAYONE Secured Invoice
 *     * 3391 - PAYONE Secured Installment
 *     * 3392 - PAYONE Secured Direct Debit
 * @example CONSUMER_REQUEST
 */
export enum CancellationReason {
  CONSUMER_REQUEST = 'CONSUMER_REQUEST',
  UNDELIVERABLE = 'UNDELIVERABLE',
  DUPLICATE = 'DUPLICATE',
  FRAUDULENT = 'FRAUDULENT',
  ORDER_SHIPPED_IN_FULL = 'ORDER_SHIPPED_IN_FULL',
  AUTOMATED_SHIPMENT_FAILED = 'AUTOMATED_SHIPMENT_FAILED',
}

export interface CancelPaymentRequest {
  cancellationReason?: CancellationReason;
}

export interface CancelPaymentResponse {
  payment?: PaymentResponse;
}

/**
 *  @description Request to mark items as of the respective Checkout as cancelled and to automatically reverse the associated
 *     payment.
 *     A Cancel can be created for a full or the partial ShoppingCart of the Checkout.
 *     The platform will automatically calculate the respective amount to trigger the Cancel. For a partial Cancel a
 *     list of items must be provided.
 *
 *     The cancellationReason is mandatory for BNPL payment methods (paymentProductId 3390, 3391 and 3392).
 *     For other payment methods the cancellationReason is not mandatory but can be used for reporting and
 *     reconciliation purposes.
 */
export interface CancelRequest {
  cancelType?: CancelType;
  cancellationReason?: CancellationReason;
  cancelItems?: CancelItem[];
}

export interface CancelResponse {
  cancelPaymentResponse?: CancelPaymentResponse;
  shoppingCart?: ShoppingCartResult;
}

/**
 * @description The cancelType refers to the ShoppingCart items of the Checkout.
 *     cancelType = FULL should be provided if all items should be marked as cancelled and the payment for the entire
 *     ShoppingCart should be reversed.
 *     cancelType = PARTIAL should be provided if only certain items should be marked as cancelled and the Cancel
 *     should not be made for the entire ShoppingCart. For this type the list of items has to be provided.
 *     Please note that a reversal for a partial payment will not reverse the respective amount from the authorization
 *     but only reduces the openAmount that is ready for collecting.
 *
 *     Following conditions apply to the Cancel request:
 *       * items must be in status ORDERED
 *       * there was no Capture, Refund or Cancel triggered over the Payment Execution resource
 *       * for the cancelType FULL no items are provided in the request
 *     Note: If a DISCOUNT productType is among the ShoppingCart items, only cancelType FULL is possible.
 */
export enum CancelType {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
}

/** @description Object containing Capture details. */
export interface CaptureOutput {
  amountOfMoney?: AmountOfMoney;
  /**
   * @description It allows you to store additional parameters for the transaction in JSON format.
   *     This field must not contain any personal data.
   * @example {'SessionID':'126548354','ShopperID':'7354131'}
   */
  merchantParameters?: string;
  references?: PaymentReferences;
  /** @description Payment method identifier used by our payment engine. */
  paymentMethod?: string;
}

/** @description If the shopping cart is specified, a Capture is made with the amount of the shopping cart for the items that are specified. */
export interface CapturePaymentRequest {
  /**
   * Format: int64
   * @description Here you can specify the amount that you want to capture (specified in cents, where single digit currencies
   *     are presumed to have 2 digits). The amount can be lower than the amount that was authorized, but not higher.
   *      If left empty, the full amount will be captured and the request will be final.
   *      If the full amount is captured, the request will also be final.
   */
  amount?: number;
  /**
   * @description This property indicates whether this will be the final operation.
   *     If the full amount should not captured but the property is set to true, the remaining amount will automatically be cancelled.
   *
   * @default false
   */
  isFinal: boolean;
  cancellationReason?: CancellationReason;
  references?: PaymentReferences;
  delivery?: DeliveryInformation;
}

export interface CapturePaymentResponse {
  captureOutput?: CaptureOutput;
  status?: StatusValue;
  statusOutput?: PaymentStatusOutput;
  /**
   * @description Unique payment transaction identifier of the payment gateway.
   * @example 3066019730_1
   */
  id?: string;
}

/** @description Fraud results contained in the CardFraudResults object. */
export interface CardFraudResults {
  /**
   * @description  Result of the Address Verification Service checks. Possible values are:
   *      * A - Address (Street) matches, Zip does not
   *      * B - Street address match for international transactions—Postal code not verified due to incompatible
   *      formats
   *      * C - Street address and postal code not verified for international transaction due to incompatible formats
   *      * D - Street address and postal code match for international transaction, cardholder name is incorrect
   *      * E - AVS error
   *      * F - Address does match and five digit ZIP code does match (UK only)
   *      * G - Address information is unavailable; international transaction; non-AVS participant
   *      * H - Billing address and postal code match, cardholder name is incorrect (Amex)
   *      * I - Address information not verified for international transaction
   *      * K - Cardholder name matches (Amex)
   *      * L - Cardholder name and postal code match (Amex)
   *      * M - Cardholder name, street address, and postal code match for international transaction
   *      * N - No Match on Address (Street) or Zip
   *      * O - Cardholder name and address match (Amex)
   *      * P - Postal codes match for international transaction—Street address not verified due to incompatible formats
   *      * Q - Billing address matches, cardholder is incorrect (Amex)
   *      * R - Retry, System unavailable or Timed out
   *      * S - Service not supported by issuer
   *      * U - Address information is unavailable
   *      * W - 9 digit Zip matches, Address (Street) does not
   *      * X - Exact AVS Match
   *      * Y - Address (Street) and 5 digit Zip match
   *      * Z - 5 digit Zip matches, Address (Street) does not
   *      * 0 - No service available
   * @example A
   */
  avsResult?: string;
}

/** @description Information for card payments realized at a POS. */
export interface CardPaymentDetails {
  /**
   * @description Reference to the card of the transaction.
   * @example 672559XXXXXX1108
   */
  maskedCardNumber?: string;
  /**
   * @description ID of the token. This property is populated when the payment was done with a token.
   * @example 0ca037cc-9079-4df7-8f6f-f2a3443ee521
   */
  paymentProcessingToken?: string;
  /**
   * @description Token to identify the card in the reporting.
   * @example 12a037cc-833d-8b45-8f6f-11c34171f4e1
   */
  reportingToken?: string;
  /**
   * @description Identifier for a successful authorization, reversal or refund.
   *     Usually provided by the issuer system. Only provided for card payments.
   *
   * @example 260042
   */
  cardAuthorizationId?: string;
}

/** @description Object containing additional non PCI DSS relevant card information. used instead of card (missing fields: cardNumber, expiryDate, cvv)    */
export interface CardInfo {
  /** @description The card holder's name on the card. */
  cardholderName?: string;
}

/** @description Object containing the card payment method details.    */
export interface CardPaymentMethodSpecificOutput {
  /**
   * Format: int32
   * @description Payment product identifier - please check product documentation for a full overview of possible values.
   * @example 840
   */
  paymentProductId?: number;
  /** @description Card Authorization code as returned by the acquirer */
  authorisationCode?: string;
  fraudResults?: CardFraudResults;
  threeDSecureResults?: ThreeDSecureResults;
}

/** @description Object containing the specific input details for card payments.  */
export interface CardPaymentMethodSpecificInput {
  authorizationMode?: AuthorizationMode;
  recurring?: CardRecurrenceDetails;
  /**
   * @description ID of the token to use to create the payment.
   * @example 0ca037cc-9079-4df7-8f6f-f2a3443ee521
   */
  paymentProcessingToken?: string;
  /**
   * @description Token to identify the card in the reporting.
   * @example 12a037cc-833d-8b45-8f6f-11c34171f4e1
   */
  readonly reportingToken?: string;
  transactionChannel?: TransactionChannel;
  unscheduledCardOnFileRequestor?: UnscheduledCardOnFileRequestor;
  unscheduledCardOnFileSequenceIndicator?: UnscheduledCardOnFileSequenceIndicator;
  /**
   * Format: int32
   * @description Payment product identifier - please check product documentation for a full overview of possible values.
   * @example 840
   */
  paymentProductId?: number;
  card?: CardInfo;
  /**
   * @description The URL that the customer is redirect to after the payment flow has finished. You can add any number of key
   *     value pairs in the query string that, for instance help you to identify the customer when they return to
   *     your site. Please note that we will also append some additional key value pairs that will also help you with
   *     this identification process.
   *     Note: The provided URL should be absolute and contain the protocol to use, e.g. http:// or https://. For use
   *     on mobile devices a custom protocol can be used in the form of protocol://. This protocol must be registered
   *     on the device first.
   *     URLs without a protocol will be rejected.
   * @example https://secure.ogone.com/ncol/test/displayparams.asp
   */
  returnUrl?: string;
  cardOnFileRecurringFrequency?: CardOnFileRecurringFrequency;
  /**
   * @description The end date of the last scheduled payment in a series of transactions.
   *     Format YYYYMMDD Supported soon
   */
  cardOnFileRecurringExpiration?: string;
}

/**
 * @description Period of payment occurrence for recurring and installment payments. Allowed values:
 *     * Yearly
 *     * Quarterly
 *     * Monthly
 *     * Weekly
 *     * Daily
 *     Supported soon
 */
export enum CardOnFileRecurringFrequency {
  YEARLY = 'Yearly',
  QUARTERLY = 'Quarterly',
  MONTHLY = 'Monthly',
  WEEKLY = 'Weekly',
  DAILY = 'Daily',
}

/** @description Object containing data related to recurring. */
export interface CardRecurrenceDetails {
  /**
   *  @description * first = This transaction is the first of a series of recurring transactions
   *     * recurring = This transaction is a subsequent transaction in a series of recurring transactions
   *
   *     Note: For any first of a recurring the system will automatically create a token as you will need to use a
   *     token for any subsequent recurring transactions. In case a token already exists this is indicated in the
   *     response with a value of False for the isNewToken property in the response.
   */
  recurringPaymentSequenceIndicator?: string;
}

/** @description This object contains information of all items in the cart. If a cart item is provided, the productPrice and quantity is required. */
export interface CartItemInput {
  invoiceData?: CartItemInvoiceData;
  orderLineDetails?: OrderLineDetailsInput;
}

/** @description This object contains information of all items in the cart. If a cart item is provided, the productPrice and quantity is required. */
export interface CartItemPatch {
  invoiceData?: CartItemInvoiceData;
  orderLineDetails?: OrderLineDetailsPatch;
}

/** @description This object contains information of all items in the cart. If a cart item is provided, the productPrice and quantity is required. */
export interface CartItemResult {
  invoiceData?: CartItemInvoiceData;
  orderLineDetails?: OrderLineDetailsResult;
}

/**
 * @description The Checkout corresponds to the order of the WL API. We do not take additionalInput from the WL API. We have no
 *    shipping and use deliveryAddress instead of address.
 */
export interface CheckoutResponse {
  /**
   * Format: UUID
   * @description reference to the Commerce Case.
   * @example 4f0c512e-f12c-11ec-8ea0-0242ac120002
   */
  commerceCaseId?: string;
  /**
   * Format: UUID
   * @description reference to the Checkout.
   * @example 4f0c512e-f12c-11ec-8ea0-0242ac120002
   */
  checkoutId?: string;
  /**
   * @description Unique identifier for the customer.
   * @example 1234
   */
  merchantCustomerId?: string;
  amountOfMoney?: AmountOfMoney;
  references?: CheckoutReferences;
  shipping?: Shipping;
  shoppingCart?: ShoppingCartResult;
  paymentExecutions?: PaymentExecution[];
  checkoutStatus?: StatusCheckout;
  statusOutput?: StatusOutput;
  paymentInformation?: PaymentInformationResponse[];
  creationDateTime?: CreationDateTime;
  allowedPaymentActions?: AllowedPaymentActions[];
}

/**
 * @description To complete the Payment the completeFinancingMethodSpecificInput has to be provided.
 *    At the moment it is only available for PAYONE Secured Installment (paymentProductId 3391).
 */
export interface CompleteFinancingPaymentMethodSpecificInput {
  /**
   * Format: int32
   * @description Payment product identifier. Currently supported payment methods:
   *     * 3391 - PAYONE Secured Installment
   * @example 3391
   */
  paymentProductId?: number;
  /**
   * @description * true = the payment requires approval before the funds will be captured using the Approve payment or Capture payment API
   *                false = the payment does not require approval, and the funds will be captured automatically
   *
   *  If the parameter is not provided in the request, the default value will be true
   */
  requiresApproval?: boolean;
  paymentProduct3391SpecificInput?: PaymentProduct3391SpecificInput;
}

/** @description To complete the Order the completePaymentMethodSpecificInput has to be provided, containing the selected installmentOptionId as well as the the bankAccountInformation of the customer.  */
export interface CompletePaymentMethodSpecificInput {
  paymentProduct3391SpecificInput?: PaymentProduct3391SpecificInput;
}

export interface CustomerToken {
  token?: string;
}

export enum DeliveryType {
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL',
}

export interface EntityReference {
  id?: string;
  key?: string;
  code?: string;
}

export interface FraudCheckResponse {
  status?: StatusValue;
  statusOutput?: PaymentStatusOutput;
  fraudResults?: FraudResults;
}

export interface FraudResults {
  deviceFingerprint?: string;
  sessionId?: string;
}

/**
 * @description Current high-level status of the Checkout
 * @example OPEN
 */
export enum StatusCheckout {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  COMPLETION = 'COMPLETION',
  COMPLETED = 'COMPLETED',
  BILLED = 'BILLED',
  CHARGEBACKED = 'CHARGEBACKED',
  DELETED = 'DELETED',
}

/**
 * @description The Complete request is the last step to finalize the initially created Payment.
 *   It requires the completeFinancingPaymentMethodSpecificInput.
 *   The data for the order object should not differ from the previously provided information in Commerce Case, Checkout and Payment, but will not be validated nor automatically loaded from the Commerce Platform.
 */
export interface CompletePaymentRequest {
  financingPaymentMethodSpecificInput?: CompleteFinancingPaymentMethodSpecificInput;
  order?: Order;
  device?: CustomerDevice;
}

export interface CompletePaymentResponse {
  creationOutput?: PaymentCreationOutput;
  merchantAction?: MerchantAction;
  payment?: PaymentResponse;
}

/**
 * @description Request to create a Checkout for a Commerce Case.
 *     The payment for the Checkout can be directly executed if autoExecuteOrder = true.
 *     In this case, the paymentMethodSpecificInput must be provided and only a full order is possible.
 *
 *     If no amountOfMoney is provided, the platform will calculate the respective Checkout amount based on the
 *     cartItem productPrice and quantity.
 *
 *     In case of a payment error, the payment can be retried by providing the respective commerceCaseId and checkoutId
 *     to the the Order or Payment Execution endpoint.
 */
export interface CreateCheckoutRequest {
  amountOfMoney?: AmountOfMoney;
  references?: CheckoutReferences;
  shipping?: Shipping;
  shoppingCart?: ShoppingCartInput;
  orderRequest?: OrderRequest;
  creationDateTime?: CreationDateTime;
  /**
   * @description Set this flag to directly execute a payment when creating a Commerce Case or Checkout.
   *     If the value for autoExecuteOrder is set to true, the paymentMethodSpecificInput for the order is mandatory
   *     and has to be provided. The autoExecuteOrder can only be used for orderType = full.
   *     If no shoppingCart information has been provided, a Payment Execution will be created instead of an Order. As a consequence, only Payment Execution endpoints can be used.
   *
   * @default false
   */
  autoExecuteOrder: boolean;
}

/** @description Object containing the reference of the Checkout for following requests. */
export interface CreateCheckoutResponse {
  /**
   * Format: UUID
   * @description Reference to the Checkout. Can be used for following requests to get and update the Checkout and execute the
   *     payment.
   * @example 707ef15b-7a0a-48f2-b7d8-c95103418a9c
   */
  checkoutId?: string;
  shoppingCart?: ShoppingCartResult;
  paymentResponse?: CreatePaymentResponse;
  errorResponse?: ErrorResponse;
  amountOfMoney?: AmountOfMoney;
  references?: CheckoutReferences;
  shipping?: Shipping;
  paymentExecution?: PaymentExecution;
  checkoutStatus?: StatusCheckout;
  statusOutput?: StatusOutput;
  creationDateTime?: CreationDateTime;
  allowedPaymentActions?: AllowedPaymentActions[];
}

/** @description Object containing all details that are linked to the Checkout. */
export interface CheckoutReferences {
  /**
   * @description Unique reference of the Checkout that is also returned for reporting and reconciliation purposes.
   * @example customer-order-1234
   */
  merchantReference?: string;
  /**
   * @description Optional parameter to define the shop or touchpoint where a sale has been realized (e.g. different stores).
   * @example Shop-12345
   */
  merchantShopReference?: string;
}

/** @description Object that holds the number of found Checkouts and the requested page of Checkouts */
export interface CheckoutsResponse {
  /**
   * Format: int64
   * @description Number of found Checkouts
   * @example 3390
   */
  numberOfCheckouts?: number;
  /** @description List of Checkouts */
  checkouts?: CheckoutResponse[];
}

/** @description Object containing details of the company. */
export interface CompanyInformation {
  /**
   * @description Name of company from a customer perspective
   * @example Customer Company Name
   */
  name?: string;
}

export interface CommerceCaseResponse {
  /**
   * @description Unique reference of the Commerce Case that is also returned for reporting and reconciliation purposes.
   * @example customer-commerce-case-123
   */
  merchantReference?: string;
  /**
   * Format: UUID
   * @description Unique ID reference of the Commerce Case. It can be used to add additional Checkouts to the Commerce Case.
   * @example 0c3ab9d7-19ed-40da-9a0e-1f96f4cfb8ae
   */
  commerceCaseId?: string;
  customer?: Customer;
  checkouts?: CheckoutResponse[];
  creationDateTime?: CreationDateTime;
}

/** @description List of Commerce Cases */
export type CommerceCasesResponse = CommerceCaseResponse[];

/**
 * @description The response contains references to the created Commerce case and the Checkout. It also contains the payment
 *     response if the flag 'autoExecuteOrder' was set to true. */
export interface CreateCommerceCaseResponse {
  /**
   * Format: UUID
   * @description Unique ID of the Commerce Case. It can used to add additional Checkouts to the Commerce Case.
   * @example 707ef15b-7a0a-48f2-b7d8-c95103418a9c
   */
  commerceCaseId?: string;
  /**
   * @description Unique reference of the Commerce Case that is also returned for reporting and reconciliation purposes.
   * @example customer-commerce-case-123
   */
  merchantReference?: string;
  customer?: Customer;
  checkout?: CreateCheckoutResponse;
  creationDateTime?: CreationDateTime;
}

/** @description Object containing contact details like email address and phone number. */
export interface ContactDetails {
  /**
   * @description Email address of the customer
   * @example wile.e.coyote@acmelabs.com
   */
  emailAddress?: string;
  /**
   * @description Phone number of the customer
   * @example +1234567890
   */
  phoneNumber?: string;
}

export interface CreateCommerceCaseRequest {
  /**
   * @description Unique reference of the Commerce Case that is also returned for reporting and reconciliation purposes.
   * @example customer-commerce-case-123
   */
  merchantReference?: string;
  customer?: Customer;
  creationDateTime?: CreationDateTime;
  checkout?: CreateCheckoutRequest;
}

/**
 * Format: date-time
 * @description Creation date and time of the Checkout in RFC3339 format. It can either be provided in the request or
 *     otherwise will be automatically set to the time when the request CreateCommerceCase was received.
 *     Response values will always be in UTC time, but when providing this field in the requests, the time offset
 *     can have different formats.
 *
 *     Accepted formats are:
 *     * YYYY-MM-DD'T'HH:mm:ss'Z'
 *     * YYYY-MM-DD'T'HH:mm:ss+XX:XX
 *     * YYYY-MM-DD'T'HH:mm:ss-XX:XX
 *     * YYYY-MM-DD'T'HH:mm'Z'
 *     * YYYY-MM-DD'T'HH:mm+XX:XX
 *     * YYYY-MM-DD'T'HH:mm-XX:XX
 *
 *     All other formats may be ignored by the system.
 *
 * @example 2023-12-06T23:59:60Z
 */
export type CreationDateTime = string;

/** @description Object containing details on the created payment it has directly be executed. */
export interface CreatePaymentResponse {
  creationOutput?: PaymentCreationOutput;
  merchantAction?: MerchantAction;
  payment?: PaymentResponse;
  /**
   * Format: UUID
   * @description reference to the paymentExecution.
   * @example 4f0c512e-f12c-11ec-8ea0-0242ac120002
   */
  paymentExecutionId?: string;
}

/** @description Object containing the details of a customer. */
export interface Customer {
  companyInformation?: CompanyInformation;
  /**
   * @description Unique identifier for the customer.
   * @example 1234
   */
  merchantCustomerId?: string;
  billingAddress?: Address;
  contactDetails?: ContactDetails;
  /**
   * @description Fiscal registration number of the customer or the tax registration number of the company for a business
   *     customer. Please find below specifics per country:
   *      * Brazil - Consumer (CPF) with a length of 11 digits
   *      * Brazil - Company (CNPJ) with a length of 14 digits
   *      * Denmark - Consumer (CPR-nummer or personnummer) with a length of 10 digits
   *      * Finland - Consumer (Finnish: henkilötunnus (abbreviated as HETU), Swedish: personbeteckning) with a
   *     length of 11 characters
   *      * Norway - Consumer (fødselsnummer) with a length of 11 digits
   *      * Sweden - Consumer (personnummer) with a length of 10 or 12 digits
   */
  fiscalNumber?: string;
  /**
   * @description Business relation to the customer. Possible values:
   *     * B2C - Indicates business to consumer
   *     * B2B - Indicates business to business
   *
   *     Mandatory for the the following payment methods:
   *     * 3390 - PAYONE Secured Invoice
   *     * 3391 - PAYONE Secured Installment
   *     * 3392 - PAYONE Secured Direct Debit
   */
  businessRelation?: string;
  /**
   * @description The locale that the customer should be addressed in (for 3rd parties).
   *
   *     Note: Only the language code is supported.
   * @example de
   */
  locale?: string;
  personalInformation?: PersonalInformation;
}

/** @description Object containing information about the device of the end customer. */
export interface CustomerDevice {
  /** @description The IP address of the customer client from the HTTP Headers. */
  ipAddress?: string;
  /** @description Tokenized representation of the end customers device. For example used for PAYONE Buy Now, Pay Later (BNPL). */
  deviceToken?: string;
}

/**
 * @description Delivery object contains additional information about the delivery/shipment, which is the basis for the Capture.
 *     The amountOfMoney in the cartItem will not be used in the request.
 */
export interface DeliveryInformation {
  /** @description Items delivered. */
  items?: CartItemInput[];
}

export interface DeliverItem {
  /**
   * Format: UUID
   * @description Id of the item to deliver.
   * @example 4f0c512e-f12c-11ec-8ea0-0242ac120002
   */
  id: string;
  /**
   * Format: int64
   * @description Quantity of the units being delivered, should be greater than zero
   *     Note: Must not be all spaces or all zeros
   * @example 1
   */
  quantity: number;
}

/**
 * @description Request to mark items of the respective Checkout as delivered and to automatically execute a Capture.
 *     A Deliver can be created for a full or the partial ShoppingCart of the Checkout.
 *     The platform will automatically calculate the respective amount to trigger the Capture. For a partial Deliver a
 *     list of items must be provided.
 *     The item details for the Capture will be automatically loaded from the Checkout.
 *
 *     The cancellationReason must be provided if deliverType is set to PARTIAL and isFinal is set to true for BNPL
 *     payment methods (paymentProductId 3390, 3391 and 3392).
 *     For other payment methods the cancellationReason is not mandatory in this case but can be used for reporting
 *     and reconciliation purposes.
 */
export interface DeliverRequest {
  deliverType?: DeliverType;
  /**
   * @description This property indicates whether this will be the final operation.
   *     For deliverType FULL, it is always the final operation.
   *     If deliverType PARTIAL is provided and the property is set to true, the remaining amount of the items will be cancelled and the items are marked as CANCELLED.
   *
   * @default false
   */
  isFinal: boolean;
  cancellationReason?: CancellationReason;
  deliverItems?: DeliverItem[];
}

export interface DeliverResponse {
  capturePaymentResponse?: CapturePaymentResponse;
  shoppingCart?: ShoppingCartResult;
}

/**
 * @description The deliverType refers to the ShoppingCart items of the Checkout.
 *     deliverType = FULL should be provided if all items should be marked as delivered and the payment for the entire
 *     ShoppingCart should be captured.
 *     deliverType = PARTIAL should be provided if only certain items should be marked as delivered and the Capture
 *     should not be made for the entire ShoppingCart. For this type the list of items has to be provided.
 *     Following conditions apply to the Deliver request:
 *       * items must be in status ORDERED
 *       * there was no Capture, Refund or Cancel triggered over the Payment Execution resource
 *       * for the deliverType FULL no items are provided in the request
 *     Note: If a DISCOUNT productType is among the ShoppingCart items, only deliverType FULL is possible.
 */
export enum DeliverType {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
}

export interface ErrorResponse {
  /** @description Unique reference of this error response for debugging purposes */
  errorId?: string;
  errors?: APIError[];
}

/**
 * @description The extendedCheckoutStatus provides a more granular status of the Checkout based on the respective amounts. The
 *     extendedCheckoutStatus include the regular Checkout status OPEN, DELETED, PENDING_COMPLETION, COMPLETED, BILLED,
 *     and CHARGEBACKED as well as three additional status:
 *
 *     1. PARTIALLY_BILLED: Checkout amount has been partially collected. Overall the Checkout status is BILLED and one
 *     of the following conditions is true:
 *       (1) the openAmount is greater than zero or
 *       (2) the openAmount is zero, the refundAmount is zero and the checkoutAmount is not equal to collectedAmount plus the cancelledAmount.
 *     2. PARTIALLY_REFUNDED: The entire Checkout amount has been captured and an amount has been partially refunded to
 *     customer. Overall the Checkout status is BILLED, the openAmount is zero and the refundAmount and collectedAmount
 *     are greater than zero.
 *     3. REFUNDED: The entire Checkout amount has been refunded to the customer. Overall the Checkout status is
 *     BILLED, the openAmount and collectedAmount are zero but the refundAmount is greater than zero.
 *
 * @example OPEN
 */
export enum ExtendedCheckoutStatus {
  OPEN = 'OPEN',
  DELETED = 'DELETED',
  PENDING_COMPLETION = 'PENDING_COMPLETION',
  COMPLETED = 'COMPLETED',
  PARTIALLY_BILLED = 'PARTIALLY_BILLED',
  BILLED = 'BILLED',
  CHARGEBACKED = 'CHARGEBACKED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  REFUNDED = 'REFUNDED',
}

/** @description Object containing the specific input details for financing payment methods (Buy Now Pay Later) */
export interface FinancingPaymentMethodSpecificInput {
  /**
   * Format: int32
   * @description Payment product identifier - please check product documentation for a full overview of possible values.
   *     Currently supported payment methods
   *     * 3390 - PAYONE Secured Invoice
   *     * 3391 - PAYONE Secured Installment
   *     * 3392 - PAYONE Secured Direct Debit
   * @example 3390
   */
  paymentProductId?: number;
  /**
   * @description * true = the payment requires approval before the funds will be captured using the Approve payment or
   *     Capture payment API
   *     * false = the payment does not require approval, and the funds will be captured automatically
   *
   *     If the parameter is not provided in the request, the default value will be true
   */
  requiresApproval?: boolean;
  paymentProduct3392SpecificInput?: PaymentProduct3392SpecificInput;
}

/** @description Object containing the specific output details for financing payment methods (Buy Now Pay Later) */
export interface FinancingPaymentMethodSpecificOutput {
  /**
   * Format: int32
   * @description Payment product identifier - please check product documentation for a full overview of possible values.
   *     Currently supported payment methods
   *     * 3390 - PAYONE Secured Invoice
   *     * 3391 - PAYONE Secured Installment
   *     * 3392 - PAYONE Secured Direct Debit
   * @example 3390
   */
  paymentProductId?: number;
  paymentProduct3391SpecificOutput?: PaymentProduct3391SpecificOutput;
}

export interface InstallmentOption {
  /**
   * @description Installment option Identifier. Use this in the Complete Payment for the selected installment option.
   * @example IOP_478d44fea0494eea86bc87f9e4a63328
   */
  installmentOptionId: string;
  /**
   * Format: int32
   * @description The number of monthly payments for this installment.
   * @example 12
   */
  numberOfPayments: number;
  /** @description Monthly rate amount. */
  monthlyAmount: AmountOfMoney;
  /** @description Last rate amount. */
  lastRateAmount: AmountOfMoney;
  /**
   * Format: int32
   * @description Effective interest amount in percent with two decimals.
   * @example 1209
   */
  effectiveInterestRate: number;
  /**
   * Format: int32
   * @description Nominal interest amount in percent with two decimals.
   * @example 1199
   */
  nominalInterestRate: number;
  /** @description Total rate amount. */
  totalAmount: AmountOfMoney;
  /** @description Due date of first rate.
   *     Format: YYYYMMDD */
  firstRateDate: string;
  /** @description Link with credit information. */
  creditInformation: LinkInformation;
}

/** @description Object containing the line items of the invoice or shopping cart. */
export interface CartItemInvoiceData {
  /**
   * @description Shopping cart item description.
   *     The description will also be displayed in the portal as the product name.
   *
   * @example Smartwatch
   */
  description?: string;
}

/** @description URL and content type information for an web resource. */
export interface LinkInformation {
  /** @description URL of link. */
  href: string;
  /** @description Content type of linked data. */
  type: string;
}

/**
 * @description Indicates in which status the line item is
 */
export enum CartItemStatus {
  ORDERED = 'ORDERED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
  WAITING_FOR_PAYMENT = 'WAITING_FOR_PAYMENT',
}

/**
 * @description Specifies whether the mandate is for one-off or recurring payments. Possible values are:
 *     * UNIQUE
 *     * RECURRING
 */
export enum MandateRecurrenceType {
  UNIQUE = 'UNIQUE',
  RECURRING = 'RECURRING',
}

/**
 * @description Object that contains the action, including the needed data, that you should perform next, like showing
 *     instructions, showing the transaction results or redirect to a third party to complete the payment
 */
export interface MerchantAction {
  /**
   * @description Action merchants needs to take in the online payment process. Possible values are:
   *      * REDIRECT - The customer needs to be redirected using the details found in redirectData
   *      * SHOW_FORM - The customer needs to be shown a form with the fields found in formFields. You can submit the
   *     data entered by the user in a Complete payment request.
   *      * SHOW_INSTRUCTIONS - The customer needs to be shown payment instruction using the details found in
   *     showData. Alternatively the instructions can be rendered by us using the instructionsRenderingData
   *      * SHOW_TRANSACTION_RESULTS - The customer needs to be shown the transaction results using the details found
   *     in showData. Alternatively the instructions can be rendered by us using the instructionsRenderingData
   *      * MOBILE_THREEDS_CHALLENGE - The customer needs to complete a challenge as part of the 3D Secure
   *     authentication inside your mobile app. The details contained in mobileThreeDSecureChallengeParameters need
   *     to be provided to the EMVco certified Mobile SDK as a challengeParameters object.
   *      * CALL_THIRD_PARTY - The merchant needs to call a third party using the data found in thirdPartyData
   * @example REDIRECT
   */
  actionType?: string;
  redirectData?: RedirectData;
}

/** @description Object containing the specific input details for mobile payments. */
export interface MobilePaymentMethodSpecificInput {
  /**
   * Format: int32
   * @description Payment product identifier - please check product documentation for a full overview of possible values.
   * @example 840
   */
  paymentProductId?: number;
  authorizationMode?: AuthorizationMode;
  /**
   * @description The payment data if we will do the decryption of the encrypted payment data. Typically you'd use
   *     encryptedCustomerInput in the root of the create payment request to provide the encrypted payment data
   *     instead.
   */
  encryptedPaymentData?: string;
  /** @description Public Key Hash A unique identifier to retrieve key used by Apple to encrypt information. */
  publicKeyHash?: string;
  /** @description Ephemeral Key A unique generated key used by Apple to encrypt data. */
  ephemeralKey?: string;
  paymentProduct302SpecificInput?: PaymentProduct320SpecificInput;
}

/** @description Object containing the mobile payment method details. */
export interface MobilePaymentMethodSpecificOutput {
  /**
   * Format: int32
   * @description Payment product identifier - please check product documentation for a full overview of possible values.
   * @example 302
   */
  paymentProductId?: number;
  /** @description Card Authorization code as returned by the acquirer */
  authorisationCode?: string;
  fraudResults?: CardFraudResults;
  threeDSecureResults?: ThreeDSecureResults;
  /** @description The card network that was used for a mobile payment method operation */
  network?: string;
}

/** @description Order object containing order related data Please note that this object is required to be able to submit the amount. */
export interface Order {
  amountOfMoney?: AmountOfMoney;
  customer?: Customer;
  references: References;
  shipping?: Shipping;
  shoppingCart?: ShoppingCartInput;
}

/** @description Items should only be provided for orderType = PARTIAL */
export interface OrderItem {
  /**
   * Format: UUID
   * @description Id of the item from the ShoppingCart. The id will be returned in the response from create Checkout request.
   * @example 4f0c512e-f12c-11ec-8ea0-0242ac120002
   */
  id: string;
  /**
   * Format: int64
   * @description Quantity of the specific item. Must be greater than zero.
   *     Note: Must not be all spaces or all zeros
   *
   * @example 1
   */
  quantity: number;
}

/** @description Object containing additional information that when supplied can have a beneficial effect on the discountrates. */
export interface OrderLineDetailsInput {
  /**
   * @description Product or UPC Code
   * @example ASP01
   */
  productCode?: string;
  /**
   * Format: int64
   * @description The price of one unit of the product, the value should be zero or greater.
   * @example 480
   */
  productPrice: number;
  productType?: ProductType;
  /**
   * Format: int64
   * @description Quantity of the units being purchased, should be greater than zero
   *     Note: Must not be all spaces or all zeros
   * @example 1
   */
  quantity: number;
  /**
   * Format: int64
   * @description Tax on the line item, with the last two digits implied as decimal places
   * @example 0
   */
  taxAmount?: number;
  /**
   * Format: uri
   * @description URL of the product in shop.
   *
   *     Used for PAYONE Buy Now, Pay Later (BNPL).
   * @example https://shop.url/watches/watch01
   */
  productUrl?: string;
  /**
   * Format: uri
   * @description URL of a product image.
   *
   *     Used for PAYONE Buy Now, Pay Later (BNPL).
   * @example https://shop.url/watches/watch01.jpg
   */
  productImageUrl?: string;
  /**
   * @description Category path of the item.
   *
   *     Used for PAYONE Buy Now, Pay Later (BNPL).
   * @example Watches > Smartwatches
   */
  productCategoryPath?: string;
  /**
   * @description Optional parameter to define the delivery shop or touchpoint where an item has been collected (e.g. for
   *     Click & Collect or Click & Reserve).
   * @example Store-12345
   */
  merchantShopDeliveryReference?: string;
}

/** @description Object containing additional information that when supplied can have a beneficial effect on the discountrates. */
export interface OrderLineDetailsPatch extends OrderLineDetailsInput {
  /**
   * Format: UUID
   * @description Unique identifier of a cart item
   * @example 7a3444d3-f6ce-4b6e-b6c4-2486a160cf19
   */
  id?: string;
  status?: CartItemOrderStatus[];
}

/** @description Object containing additional information that when supplied can have a beneficial effect on the discountrates. */
export interface OrderLineDetailsResult extends OrderLineDetailsInput {
  /**
   * Format: UUID
   * @description Unique identifier of a cart item
   * @example 7a3444d3-f6ce-4b6e-b6c4-2486a160cf19
   */
  id?: string;
  status?: CartItemOrderStatus[];
}

/**
 * @description Enum to classify items that are purchased
 *     * GOODS - Goods
 *     * SHIPMENT - Shipping charges
 *     * HANDLING_FEE - Handling fee
 *     * DISCOUNT - Voucher / discount
 */
export enum ProductType {
  GOODS = 'GOODS',
  SHIPMENT = 'SHIPMENT',
  HANDLING_FEE = 'HANDLING_FEE',
  DISCOUNT = 'DISCOUNT',
}

/** @description Object that holds all reference properties that are linked to this transaction. */
export interface References {
  /** @description Descriptive text that is used towards to customer, either during an online Checkout at a third party and/or
   *     on the statement of the customer. For card transactions this is usually referred to as a Soft Descriptor.
   *     The maximum allowed length varies per card acquirer:
   *      * AIB - 22 characters
   *      * American Express - 25 characters
   *      * Atos Origin BNP - 15 characters
   *      * Barclays - 25 characters
   *      * Catella - 22 characters
   *      * CBA - 20 characters
   *      * Elavon - 25 characters
   *      * First Data - 25 characters
   *      * INICIS (INIPAY) - 22-30 characters
   *      * JCB - 25 characters
   *      * Merchant Solutions - 22-25 characters
   *      * Payvision (EU & HK) - 25 characters
   *      * SEB Euroline - 22 characters
   *      * Sub1 Argentina - 15 characters
   *      * Wells Fargo - 25 characters
   *
   *     Note that we advise you to use 22 characters as the max length as beyond this our experience is that issuers
   *     will start to truncate. We currently also only allow per API call overrides for AIB and Barclays
   *     For alternative payment products the maximum allowed length varies per payment product:
   *      * 402 e-Przelewy - 30 characters
   *      * 404 INICIS - 80 characters
   *      * 802 Nordea ePayment Finland - 234 characters
   *      * 809 iDeal - 32 characters
   *      * 836 SOFORT - 42 characters
   *      * 840 PayPal - 127 characters
   *      * 841 WebMoney - 175 characters
   *      * 849 Yandex - 64 characters
   *      * 861 Alipay - 256 characters
   *      * 863 WeChat Pay - 32 characters
   *      * 880 BOKU - 20 characters
   *      * 8580 Qiwi - 255 characters
   *      * 1504 Konbini - 80 characters
   *
   *     All other payment products don't support a descriptor.
   */
  descriptor?: string;
  /**
   * @description The merchantReference is a unique identifier for a payment and can be used for reporting purposes. The
   *     merchantReference is required for the execution of a payment and has to be unique. In case a payment has
   *     failed the same merchantReference can be used again.
   *     Once a successful payment has been made the same merchantReference can no longer be used and will be
   *     rejected.
   *
   * @example 5a891df0b8cf11edaeb2af87d8ff0b2f
   */
  merchantReference: string;
  /**
   * @description It allows you to store additional parameters for the transaction in JSON format. This field must not contain any personal data.
   * @example {'SessionID':'126548354','ShopperID':'7354131'}
   */
  merchantParameters?: string;
}

/**
 * @description Request to execute an Order for the corresponding Checkout for a specific payment method.
 *     The provided data from the Commerce Case and the Checkout regarding customer, shipping, and ShoppingCart will be
 *     automatically loaded and used for the Payment Execution.
 *     In case the paymentMethodSpecificInput has already been provided when creating the Commerce Case or Checkout,
 *     this input will automatically be used.
 *     An Order can be created for a full or the partial ShoppingCart of the Checkout. For a partial Order a list of
 *     items must be provided. The platform will automatically calculate the respective amount to trigger the payment
 *     execution.
 */
export interface OrderRequest {
  orderType?: OrderType;
  orderReferences?: References;
  items?: OrderItem[];
  paymentMethodSpecificInput?: PaymentMethodSpecificInput;
}

/** @description Object that contains details on the created payment in case one has been created. */
export interface OrderResponse {
  createPaymentResponse?: CreatePaymentResponse;
  shoppingCart?: ShoppingCartResult;
}

/**
 * @description The orderType refers to the ShoppingCart of the Checkout.
 *     orderType = FULL should be provided if a payment for the entire ShoppingCart should be created.
 *     orderType = PARTIAL should be provided if the payment should be created only for certain items of the
 *     ShoppingCart. For this type the list of items has to be provided.
 *     Following conditions apply to the Order request:
 *       * amount of the Checkout can not be zero
 *       * the ShoppingCart cannot be empty
 *       * for orderType = FULL the Checkout status is OPEN, there is no other order and/or Payment Execution and no
 *     items should be provided in the body
 *       * if no paymentMethodSpecificInput has been provided in the creation of the Commerce Case or Checkout it has
 *     to be provided in this request
 */
export enum OrderType {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
}

/**
 * @description An existing shopping cart of a Checkout will not be overwritten with the Patch request.
 *     New items can be added to the shoppingCart by providing them in the request.
 *     To change existing items (delete, modify or add), the respective itemId must be provided. An item can be completely removed if quantity = 0 is provided.
 *
 *     The price of an item can be changed as long as no payment has happened for this item (i.e. as long as an item has no specific status).
 *     Items with a status can no longer be removed entirely, however the quantity can be increased or decreased (for items without payment) by using the itemId.
 *
 *     If no amountOfMoney for the Checkout is provided, the platform will calculate the respective amount based on the cartItem productPrice and productQuantity.
 */
export interface PatchCheckoutRequest {
  amountOfMoney?: AmountOfMoney;
  references?: CheckoutReferences;
  shipping?: Shipping;
  shoppingCart?: ShoppingCartPatch;
  paymentMethodSpecificInput?: PaymentMethodSpecificInput;
  paymentReferences?: References;
}

/** @description Update the customer data of the given Commerce Case */
export interface PatchCommerceCaseRequest {
  customer?: Customer;
}

export enum PaymentChannel {
  ECOMMERCE = 'ECOMMERCE',
  POS = 'POS',
}

/** @description Object containing the details of the created payment. */
export interface PaymentCreationOutput {
  /**
   * @description The external reference is an identifier for this transaction and can be used for reconciliation purposes.
   * @example C1232O2342
   */
  externalReference?: string;
}

/** @description Detailed information regarding an occurred payment event. */
export interface PaymentEvent {
  type?: PaymentType;
  amountOfMoney?: AmountOfMoney;
  paymentStatus?: StatusValue;
  cancellationReason?: CancellationReason;
  /**
   * @description Reason of the Refund (e.g. communicated by or to the costumer).
   * @example Customer complained
   */
  returnReason?: string;
}

/** @description Object contains information of the payment with a specific payment method. */
export interface PaymentExecution {
  /**
   * Format: UUID
   * @description Unique ID of paymentExecution.
   * @example 4f0c512e-f12c-11ec-8ea0-0242ac120002
   */
  paymentExecutionId?: string;
  /**
   * @description Unique payment transaction identifier of the payment gateway.
   * @example 3066019730_1
   */
  paymentId?: string;
  cardPaymentMethodSpecificInput?: CardPaymentMethodSpecificInput;
  mobilePaymentMethodSpecificInput?: MobilePaymentMethodSpecificInput;
  redirectPaymentMethodSpecificInput?: RedirectPaymentMethodSpecificInput;
  sepaDirectDebitPaymentMethodSpecificInput?: SepaDirectDebitPaymentMethodSpecificInput;
  financingPaymentMethodSpecificInput?: FinancingPaymentMethodSpecificInput;
  paymentChannel?: PaymentChannel;
  references?: References;
  events?: PaymentEvent[];
}

/**
 * @description Request to trigger a payment for a respective Checkout providing the input for a specific payment method.
 *     The data from the Commerce case and the Checkout will not be loaded automatically and there is no validation
 *     between the data input in place.
 *     Depending on the payment method, information of the customer and / or the shopping cart might be required.
 *     For more details regarding payment method specific input please check the documentation.
 */
export interface PaymentExecutionRequest {
  paymentMethodSpecificInput?: PaymentMethodSpecificInput;
  paymentExecutionSpecificInput?: PaymentExecutionSpecificInput;
}

/**
 * @description The amount of the paymentSpecificInput might differ from the Checkout amount in case of partial payments but cannot be higher.
 *     Additionally, the total amount of the provided shopping cart cannot exceed the Checkout amount.
 *     If a different currency is provided than in the Checkout, the payment execution will be declined.
 *     Provided details of the customer and shipping from the Checkout will be automatically loaded and used in the Payment Execution request.
 *     The ShoppingCart might differ from the one provided in the Checkout (e.g., for partial payments) and might be required by the payment provider (e.g., BNPL).
 *     If the ShoppingCart elements differ from the data provided in the Checkout, the existing data will not be overwritten.
 */
export interface PaymentExecutionSpecificInput {
  amountOfMoney?: AmountOfMoney;
  shoppingCart?: ShoppingCartInput;
  paymentReferences: References;
}

export interface PaymentInformationRequest {
  amountOfMoney: AmountOfMoney;
  type: PaymentType;
  paymentChannel: PaymentChannel;
  /**
   * Format: int32
   * @description Payment method identifier - please check the product documentation for a full overview of possible values.
   */
  paymentProductId: number;
  /**
   * @description Unique reference of the PaymentInformation. In case of card present transactions, the reference from the ECR
   *     or terminal will be used. It is always the reference for external transactions.
   *     (e.g. card present payments, cash payments or payments processed by other payment providers).
   *
   * @example 6a891660b8cf16edaeb26f87d86f0b2f
   */
  merchantReference?: string;
}

/** @description Object containing the related data of the created Payment Information. */
export interface PaymentInformationResponse {
  /**
   * Format: UUID
   * @description Unique ID of the Commerce Case.
   * @example 4f0c512e-f12c-11ec-8ea0-0242ac120002
   */
  commerceCaseId?: string;
  /**
   * Format: UUID
   * @description Unique ID of the Commerce Case.
   * @example 4f0c512e-f12c-11ec-8ea0-0242ac120002
   */
  checkoutId?: string;
  /**
   * @description Unique identifier of the customer.
   * @example 1234
   */
  merchantCustomerId?: string;
  /**
   * Format: UUID
   * @description Unique ID of the Payment Information.
   * @example 637ef15b-1a0a-48f2-27d8-c954a344329c
   */
  paymentInformationId?: string;
  paymentChannel?: PaymentChannel;
  /**
   * Format: int32
   * @description Payment product identifier - please check see product documentation for a full overview of possible values.
   * @example 840
   */
  paymentProductId?: number;
  /**
   * @description Unique identifier of the POS terminal of the payment transaction.
   * @example 60023723
   */
  terminalId?: string;
  /**
   * @description Unique ID that identifies a store location or transaction point and which refers to the contract number of
   *     the merchant accepting the card.
   * @example 455600217015
   */
  cardAcceptorId?: string;
  /**
   * @description Unique reference of the PaymentInformation. In case of card present transactions, the reference from the ECR
   *     or terminal will be used. It is always the reference for external transactions.
   *     (e.g. card present payments, cash payments or payments processed by other payment providers).
   *
   * @example 6a891660b8cf16edaeb26f87d86f0b2f
   */
  merchantReference?: string;
  cardPaymentDetails?: CardPaymentDetails;
  events?: PaymentEvent[];
}

/**
 * @description Input for the payment for a respective payment method.
 *     In case the paymentMethodSpecificInput has already been provided when creating the Commerce Case or Checkout, it
 *     will automatically be used for the Payment Execution.
 *     If a new input will be provided, the existing input will be updated.
 */
export interface PaymentMethodSpecificInput {
  cardPaymentMethodSpecificInput?: CardPaymentMethodSpecificInput;
  mobilePaymentMethodSpecificInput?: MobilePaymentMethodSpecificInput;
  redirectPaymentMethodSpecificInput?: RedirectPaymentMethodSpecificInput;
  sepaDirectDebitPaymentMethodSpecificInput?: SepaDirectDebitPaymentMethodSpecificInput;
  financingPaymentMethodSpecificInput?: FinancingPaymentMethodSpecificInput;
  customerDevice?: CustomerDevice;
  paymentChannel?: PaymentChannel;
}

/** @description Object containing payment details. */
export interface PaymentOutput {
  amountOfMoney?: AmountOfMoney;
  /**
   * @description It allows you to store additional parameters for the transaction in JSON format. This field should not contain any personal data.
   * @example {'SessionID':'126548354','ShopperID':'7354131'}
   */
  merchantParameters?: string;
  references?: PaymentReferences;
  cardPaymentMethodSpecificOutput?: CardPaymentMethodSpecificOutput;
  mobilePaymentMethodSpecificOutput?: MobilePaymentMethodSpecificOutput;
  /** @description Payment method identifier based on the paymentProductId. */
  paymentMethod?: string;
  redirectPaymentMethodSpecificOutput?: RedirectPaymentMethodSpecificOutput;
  sepaDirectDebitPaymentMethodSpecificOutput?: SepaDirectDebitPaymentMethodSpecificOutput;
  financingPaymentMethodSpecificOutput?: FinancingPaymentMethodSpecificOutput;
}

/** @description Object containing details from the created payout. */
interface PayoutOutput {
  amountOfMoney?: AmountOfMoney;
  references?: PaymentReferences;
  /** @description Payment method identifier based on the paymentProductId. */
  paymentMethod?: string;
}

/** @description Object containing additional Information needed for Apple Pay payment transactions. */
export interface PaymentProduct320SpecificInput {
  network?: Network;
  token?: ApplePaymentDataTokenInformation;
}

/**
 * @example GIROCARD
 */
export enum Network {
  MASTERCARD = 'MASTERCARD',
  VISA = 'VISA',
  AMEX = 'AMEX',
  GIROCARD = 'GIROCARD',
  DISCOVER = 'DISCOVER',
  JCB = 'JCB',
}

/** @description Object containing specific information for PAYONE Secured Installment. */
export interface PaymentProduct3391SpecificInput {
  /** @description ID of the selected installment option. Will be provided in the response of the Order / Payment Execution request. */
  installmentOptionId: string;
  bankAccountInformation: BankAccountInformation;
}

/** @description Object containing specific information for PAYONE Secured Installment. */
export interface PaymentProduct3391SpecificOutput {
  /** @description List of installment options. */
  installmentOptions?: InstallmentOption[];
}

/** @description Object containing specific information for PAYONE Secured Direct. Debit. */
export interface PaymentProduct3392SpecificInput {
  bankAccountInformation: BankAccountInformation;
}

/** @description Output that is SEPA Direct Debit specific (i.e. the used mandate). */
export interface PaymentProduct771SpecificOutput {
  /** @description Unique reference fo a SEPA Mandate */
  mandateReference?: string;
}

/** @description Object containing the details of the PayPal account. */
export interface PaymentProduct840CustomerAccount {
  /**
   * @description Name of the company in case the PayPal account is owned by a business
   * @example Customer Company Name
   */
  companyName?: string;
  /**
   * @description First name of the PayPal account holder
   * @example John
   */
  firstName?: string;
  /**
   * @description The unique identifier of a PayPal account and will never change in the life cycle of a PayPal account.
   * @example RRCYJUTFJGZTA
   */
  payerId?: string;
  /**
   * @description Surname of the PayPal account holder
   * @example Doe
   */
  surname?: string;
}

/** @description PayPal (payment product 840) specific details. */
export interface PaymentProduct840SpecificOutput {
  billingAddress?: Address;
  customerAccount?: PaymentProduct840CustomerAccount;
  shippingAddress?: Address;
}

/** @description Object that holds all reference properties that are linked to this transaction. */
export interface PaymentReferences {
  /**
   * @description Unique reference of the Commerce Case that is also returned for reporting and reconciliation purposes.
   * @example your-order-6372
   */
  merchantReference?: string;
}

/** @description Object that holds the payment related properties. */
export interface PaymentResponse {
  paymentOutput?: PaymentOutput;
  status?: StatusValue;
  statusOutput?: PaymentStatusOutput;
  /**
   * @description Unique payment transaction identifier of the payment gateway.
   * @example PP1AA7KKLSFB9MBG
   */
  id?: string;
}

/** @description Object that holds the payment related properties for the refund of a Payment Information. */
export interface PayoutResponse {
  payoutOutput?: PayoutOutput;
  status?: StatusValue;
  statusCategory?: StatusCategoryValue;
  /**
   * @description Unique payment transaction identifier of the payment gateway.
   * @example PP1AA7KKLSFB9MBG
   */
  id?: string;
}

/**
 * @description This object has the numeric representation of the current payment status, timestamp of last status change and
 *     performable action on the current payment resource. In case of failed payments and negative scenarios, detailed
 *     error information is listed.
 */
export interface PaymentStatusOutput {
  /** @description Flag indicating if the payment can be cancelled */
  isCancellable?: boolean;
  statusCategory?: StatusCategoryValue;
  /** @description Indicates if the transaction has been authorized */
  isAuthorized?: boolean;
  /** @description Flag indicating if the payment can be refunded */
  isRefundable?: boolean;
}

/** @description Object containing personal information like name, date of birth and gender. */
export interface PersonalInformation {
  /**
   * @description The date of birth of the customer of the recipient of the loan.
   *     Format YYYYMMDD
   */
  dateOfBirth?: string;
  gender?: Gender;
  name?: PersonalName;
}

/**
 * @description The gender of the customer, possible values are:
 *      * MALE
 *      * FEMALE
 *      * UNKNOWN
 */
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNKNOWN = 'UNKNOWN',
}

/** @description Object containing the name details of the customer */
export interface PersonalName {
  /**
   * @description Given name(s) or first name(s) of the customer
   * @example Wile
   */
  firstName?: string;
  /**
   * @description Surname(s) or last name(s) of the customer
   * @example E. Coyote
   */
  surname?: string;
  /**
   * @description Title of customer
   * @example Dr.
   */
  title?: string;
}

/** @description Object containing amount and ISO currency code attributes */
export interface PositiveAmountOfMoney {
  /**
   * Format: int64
   * @description Amount in cents and always having 2 decimals
   * @example 1000
   */
  amount: number;
  /**
   * @description Three-letter ISO currency code representing the currency for the amount
   * @example EUR
   */
  currencyCode: string;
}

/**
 * @description Object containing the relevant information of a SEPA Direct Debit
 *     mandate for processing (mandatory fields in pain.008).
 *     Renamed from CreateMandateWithReturnUrl to ProcessingMandateInformation.
 */
export interface ProcessingMandateInformation {
  bankAccountIban: BankAccountInformation;
  recurrenceType: MandateRecurrenceType;
  /**
   * @description The unique identifier of the mandate
   * @example your-mandate-id
   */
  uniqueMandateReference: string;
  /**
   * @description The date of signature of the mandate.
   *     Format YYYYMMDD
   * @example 20220101
   */
  dateOfSignature: string;
  /**
   * @description Your unique creditor identifier.
   * @example DE98ZZZ09999999999
   */
  creditorId: string;
}

/** @description Object containing all data needed to redirect the customer. */
export interface RedirectData {
  /**
   * @description The URL that the customer should be redirected to. Be sure to redirect using the GET method
   * @example https://example-mandate-signing-url.com\
   */
  redirectURL?: string;
}

/** @description Object containing browser specific redirection related data. */
export interface RedirectionData {
  /**
   * @description The URL that the customer is redirected to after the payment flow has finished. You can add any number of
   *     key value pairs in the query string that, for instance help you to identify the customer when they return to
   *     your site. Please note that we will also append some additional key value pairs that will also help you with
   *     this identification process.
   *     Note: The provided URL should be absolute and contain the protocol to use, e.g. http:// or https://. For use
   *     on mobile devices a custom protocol can be used in the form of protocol://. This protocol must be registered
   *     on the device first.
   *     URLs without a protocol will be rejected.
   * @example https://secure.ogone.com/ncol/test/displayparams.asp
   */
  returnUrl: string;
}

/** @description Object containing the specific input details for payments that involve redirects to 3rd parties to complete, like iDeal and PayPal */
export interface RedirectPaymentMethodSpecificInput {
  /**
   * @description * true = the payment requires approval before the funds will be captured using the Approve payment or
   *     Capture payment API
   *     * false = the payment does not require approval, and the funds will be captured automatically
   *
   *     If the parameter is not provided in the request, the default value will be true
   */
  requiresApproval?: boolean;
  /**
   * @description ID of the token to use to create the payment.
   * @example 0ca037cc-9079-4df7-8f6f-f2a3443ee521
   */
  paymentProcessingToken?: string;
  /**
   * @description Token to identify the card in the reporting.
   * @example 12a037cc-833d-8b45-8f6f-11c34171f4e1
   */
  readonly reportingToken?: string;
  /**
   * @description Indicates if this transaction should be tokenized
   *       * true - Tokenize the transaction.
   *       * false - Do not tokenize the transaction, unless it would be tokenized by other means such as auto-
   *     tokenization of recurring payments. example: false
   */
  tokenize?: boolean;
  /**
   * Format: int32
   * @description Payment product identifier - please check product documentation for a full overview of possible values.
   * @example 840
   */
  paymentProductId?: number;
  paymentProduct840SpecificInput?: RedirectPaymentProduct840SpecificInput;
  redirectionData?: RedirectionData;
}

/** @description Object containing the redirect payment product details. */
export interface RedirectPaymentMethodSpecificOutput {
  /**
   * Format: int32
   * @description <- Payment product identifier - please check product documentation for a full overview of possible values.
   * @example 840
   */
  paymentProductId?: number;
  paymentProduct840SpecificOutput?: PaymentProduct840SpecificOutput;
  /**
   * @description ID of the token. This property is populated when the payment was done with a token.
   * @example 0ca037cc-9079-4df7-8f6f-f2a3443ee521
   */
  paymentProcessingToken?: string;
  /**
   * @description Token to identify the card in the reporting.
   * @example 12a037cc-833d-8b45-8f6f-11c34171f4e1
   */
  reportingToken?: string;
}

/** @description Object containing specific input required for PayPal payments (Payment product ID 840) */
export interface RedirectPaymentProduct840SpecificInput {
  /**
   *  @description Indicates whether to use PayPal Express Checkout Shortcut.
   *      * true = When shortcut is enabled, the consumer can select a shipping address during PayPal checkout.
   *      * false = When shortcut is disabled, the consumer cannot change the shipping address.
   *     Default value is false.
   *     Please note that this field is ignored when order.additionalInput.typeInformation.purchaseType is set to
   *     "digital"
   */
  addressSelectionAtPayPal?: boolean;
}

/**
 * @description Defines the respective payment type.
 */
export enum PaymentType {
  SALE = 'SALE',
  RESERVATION = 'RESERVATION',
  CAPTURE = 'CAPTURE',
  REFUND = 'REFUND',
  REVERSAL = 'REVERSAL',
  CHARGEBACK_REVERSAL = 'CHARGEBACK_REVERSAL',
  CREDIT_NOTE = 'CREDIT_NOTE',
  DEBIT_NOTE = 'DEBIT_NOTE',
}

export interface RefundErrorResponse {
  /** @description Unique reference, for debugging purposes, of this error response */
  errorId?: string;
  errors?: APIError[];
}

/** @description Object containing Refund details */
export interface RefundOutput {
  amountOfMoney?: AmountOfMoney;
  /**
   * @description It allows you to store additional parameters for the transaction in JSON format.
   *     This field must not contain any personal data.
   *
   * @example {'SessionID':'126548354','ShopperID':'7354131'}
   */
  merchantParameters?: string;
  references?: PaymentReferences;
  /** @description Payment method identifier used by the our payment engine. */
  paymentMethod?: string;
}

/**
 * @description Request to refund a payment for a Checkout. It is possible to perform multiple partial refunds by providing an
 *     amount that is lower than the total captured amount.
 *     The returnReason can be provided for reporting and reconciliation purposes but is not mandatory.
 */
export interface RefundRequest {
  amountOfMoney?: PositiveAmountOfMoney;
  references?: PaymentReferences;
  return?: ReturnInformation;
}

/**
 * @description This object has the numeric representation of the current Refund status, timestamp of last status change and
 *     performable action on the current Refund resource. In case of a rejected Refund, detailed error information is
 *     listed.
 */
export interface RefundPaymentResponse {
  refundOutput?: RefundOutput;
  status?: StatusValue;
  statusOutput?: PaymentStatusOutput;
  /**
   * @description Unique payment transaction identifier of the payment gateway.
   * @example 3066019730_1
   */
  id?: string;
}

/**
 * @description Return object contains additional information about the return/shipment, which is the basis for the Refund.
 *     The amountOfMoney in the cartItem will not be used in the request.
 */
export interface ReturnInformation {
  /**
   * @description Reason of the Refund (e.g. communicated by or to the consumer).
   * @example Customer complained
   */
  returnReason?: string;
  /** @description Items returned. */
  items?: CartItemInput[];
}

export interface ReturnItem {
  /**
   * Format: UUID
   * @description Id of the item to return.
   * @example 4f0c512e-f12c-11ec-8ea0-0242ac120002
   */
  id: string;
  /**
   * Format: int64
   * @description Quantity of the units being returned, should be greater than zero
   *     Note: Must not be all spaces or all zeros
   * @example 1
   */
  quantity: number;
}

/**
 * @description Request to mark items of the respective Checkout as returned and to automatically refund a payment for those
 *     items.
 *     A Return can be created for a full or the partial ShoppingCart of the Checkout.
 *     The platform will automatically calculate the respective amount to trigger the Refund. For a partial Return a
 *     list of items must be provided.
 *     The item details for the Refund will be automatically loaded from the Checkout.
 *     The returnReason can be provided for reporting and reconciliation purposes but is not mandatory.
 */
export interface ReturnRequest {
  returnType?: ReturnType;
  /**
   * @description Reason of the Refund (e.g. communicated by or to the consumer).
   * @example Customer complained
   */
  returnReason?: string; // Reason for the refund
  returnItems?: ReturnItem[];
}

export interface ReturnResponse {
  returnPaymentResponse?: RefundPaymentResponse;
  shoppingCart?: ShoppingCartResult;
}

/**
 * @description The returnType refers to the ShoppingCart items of the Checkout.
 *     returnType = FULL should be provided if all items should be marked as returned and the payment for the entire
 *     ShoppingCart should be refunded.
 *     returnType = PARTIAL should be provided if only certain items should be marked as returned and the Refund should
 *     not be made for the entire ShoppingCart. For this type the list of items has to be provided.
 *     Following conditions apply to the Return request:
 *       * items must be in status DELIVERED
 *       * there was no Capture, Refund or Cancel triggered over the Payment Execution resource
 *       * for the deliverType FULL no items are provided in the request
 *     Note: If a DISCOUNT productType is among the ShoppingCart items, only returnType FULL is possible.
 */
export enum ReturnType {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
}

/** @description Object containing the specific input details for SEPA direct debit payments */
export interface SepaDirectDebitPaymentMethodSpecificInput {
  paymentProduct771SpecificInput?: SepaDirectDebitPaymentProduct771SpecificInput;
  /**
   * Format: int32
   * @description Payment product identifier - please check product documentation for a full overview of possible values.
   * @example 840
   */
  paymentProductId?: number;
}

/** @description Object containing information specific to SEPA Direct Debit */
export interface SepaDirectDebitPaymentProduct771SpecificInput {
  /**
   * @description The unique reference of the existing mandate to use in this payment.
   * @example exampleMandateReference
   */
  existingUniqueMandateReference?: string;
  mandate?: ProcessingMandateInformation;
}

/** @description Object containing the SEPA direct debit details. */
export interface SepaDirectDebitPaymentMethodSpecificOutput {
  /**
   * Format: int32
   * @description Payment product identifier - please check product documentation for a full overview of possible values.
   * @example 840
   */
  paymentProductId?: number;
  paymentProduct771SpecificOutput?: PaymentProduct771SpecificOutput;
}

/** @description Object containing information regarding shipping / delivery */
export interface Shipping {
  address?: AddressPersonal;
}

/** @description Shopping cart data, including items and specific amounts. */
export interface ShoppingCartInput {
  items?: CartItemInput[];
}

/** @description Shopping cart data, including items and specific amounts. */
export interface ShoppingCartPatch {
  items?: CartItemPatch[];
}

/** @description Shopping cart data, including items and specific amounts. */
export interface ShoppingCartResult {
  items?: CartItemResult[];
}

/**
 * @description Highlevel status of the payment, payout or Refund.
 */
export enum StatusCategoryValue {
  CREATED = 'CREATED',
  UNSUCCESSFUL = 'UNSUCCESSFUL',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PENDING_MERCHANT = 'PENDING_MERCHANT',
  PENDING_CONNECT_OR_3RD_PARTY = 'PENDING_CONNECT_OR_3RD_PARTY',
  COMPLETED = 'COMPLETED',
  REVERSED = 'REVERSED',
  REFUNDED = 'REFUNDED',
}

/** @description Detailed information regarding an occurred payment event. */
export interface CartItemOrderStatus {
  cartItemStatus?: CartItemStatus;
  /**
   * Format: int64
   * @description Amount of units for which this status is applicable, should be greater than zero
   * @example 1
   */
  quantity?: number;
}

/** @description Contains information about whether the payment of the Checkout has already been completed and how much of the total sum has been collected already. */
export interface StatusOutput {
  paymentStatus?: PaymentStatus;
  /** @description Indicates whether the Checkout can still be modified. False if any payment is already in progress, true otherwise. */
  isModifiable?: boolean;
  /**
   * Format: int64
   * @description Amount in cents always having 2 decimals. The amount yet to be paid.
   */
  openAmount?: number;
  /**
   * Format: int64
   * @description Amount in cents always having 2 decimals. The amount that has already been collected.
   */
  collectedAmount?: number;
  /**
   * Format: int64
   * @description Amount in cents always having 2 decimals. The amount that has already been cancelled.
   */
  cancelledAmount?: number;
  /**
   * Format: int64
   * @description Amount in cents always having 2 decimals. Amount that has been collected but was refunded to the customer.
   */
  refundedAmount?: number;
  /**
   * Format: int64
   * @description Amount in cents always having 2 decimals. Amount that has been collected but was charged back by the
   *     customer.
   */
  chargebackAmount?: number;
}

/**
 * @description * WAITING_FOR_PAYMENT - There does not yet exist a PaymentExecution nor a PaymentInformation for this
 *     Checkout.
 *     * PAYMENT_NOT_COMPLETED - There exists a PaymentExecution or a PaymentInformation for this Checkout, but all
 *     or some part of the total amount is still unpaid.
 *     * PAYMENT_COMPLETED - There exists a PaymentExecution or a PaymentInformation for this Checkout and the
 *     total amount is fully paid.
 *     * NO_PAYMENT - Checkout was created and deleted. No Payment Execution and no other actions can be triggered
 *     on the Checkout.
 * @example WAITING_FOR_PAYMENT
 */
export enum PaymentStatus {
  WAITING_FOR_PAYMENT = 'WAITING_FOR_PAYMENT',
  PAYMENT_NOT_COMPLETED = 'PAYMENT_NOT_COMPLETED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  NO_PAYMENT = 'NO_PAYMENT',
}

/**
 * @description Current high-level status of the payment in a human-readable form.
 */
export enum StatusValue {
  CREATED = 'CREATED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
  REJECTED_CAPTURE = 'REJECTED_CAPTURE',
  REDIRECTED = 'REDIRECTED',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PENDING_COMPLETION = 'PENDING_COMPLETION',
  PENDING_CAPTURE = 'PENDING_CAPTURE',
  AUTHORIZATION_REQUESTED = 'AUTHORIZATION_REQUESTED',
  CAPTURE_REQUESTED = 'CAPTURE_REQUESTED',
  CAPTURED = 'CAPTURED',
  REVERSED = 'REVERSED',
  REFUND_REQUESTED = 'REFUND_REQUESTED',
  REFUNDED = 'REFUNDED',
  REJECTED_REFUND = 'REJECTED_REFUND',
  CANCELLATION_REQUESTED = 'CANCELLATION_REQUESTED',
  PAUSED = 'PAUSED',
  CHARGEBACKED = 'CHARGEBACKED',
  CHARGEBACK_REVERSED = 'CHARGEBACK_REVERSED',
  ACCOUNT_CREDITED = 'ACCOUNT_CREDITED',
  ACCOUNT_DEBITED = 'ACCOUNT_DEBITED',
  PAYOUT_REQUESTED = 'PAYOUT_REQUESTED',
  REJECTED_CREDIT = 'REJECTED_CREDIT',
}

/** @description 3D Secure results object */
export interface ThreeDSecureResults {
  /**
   * @description 3D Secure Protocol version used during this transaction.
   * @example 2.2.0
   */
  version?: string;
  /**
   * @description 3D Secure ECI (Electronic Commerce Indicator) depending on the Scheme. Returned by DS.
   * @example 5
   */
  schemeEci?: string;
  appliedExemption?: AppliedExemption;
}

/**
 * @description Exemption requested and applied in the authorization.
 */
export enum AppliedExemption {
  LOW_VALUE = 'low-value',
  MERCHANT_ACQUIRER_TRANSACTION_RISK_ANALYSIS = 'merchant-acquirer-transaction-risk-analysis',
}

/**
 * @description Indicates the channel via which the payment is created. Allowed values:
 *       * ECOMMERCE - The transaction is a regular E-Commerce transaction.
 *       * MOTO - The transaction is a Mail Order/Telephone Order.
 *
 *       Defaults to ECOMMERCE.
 */
export enum TransactionChannel {
  ECOMMERCE = 'ECOMMERCE',
  MOTO = 'MOTO',
}

/**
 * @description Indicates which party initiated the unscheduled recurring transaction. Allowed values:
 *       * merchantInitiated - Merchant Initiated Transaction.
 *       * cardholderInitiated - Cardholder Initiated Transaction.
 *     Note:
 *       * When a customer has chosen to use a token on a hosted Checkout this property is set to
 *     "cardholderInitiated".
 */
export enum UnscheduledCardOnFileRequestor {
  MERCHANT_INITIATED = 'merchantInitiated',
  CARDHOLDER_INITIATED = 'cardholderInitiated',
}

/**
 * @description * first = This transaction is the first of a series of unscheduled recurring transactions
 *     * subsequent = This transaction is a subsequent transaction in a series of unscheduled recurring transactions
 *     Note: this property is not allowed if isRecurring is true.
 */
export enum UnscheduledCardOnFileSequenceIndicator {
  FIRST = 'first',
  SUBSEQUENT = 'subsequent',
}

interface BaseQueryParams {
  /**
   * @description The offset to load Items (Checkouts or Commerce-Cases, depending on the context) starting with 0.
   * @example 0
   */
  offset?: number;
  /**
   * @description The number of Items (Checkouts or Commerce-Cases, depending on the context) loaded per page
   * @example 10
   */
  size?: number;
  /** @description Date and time in RFC3339 format after which Items (Checkouts or Commerce-Cases, depending on the context) should be included in the request.
   *     Accepted formats are:
   *     * YYYY-MM-DD'T'HH:mm:ss'Z'
   *     * YYYY-MM-DD'T'HH:mm:ss+XX:XX
   *     * YYYY-MM-DD'T'HH:mm:ss-XX:XX
   *     * YYYY-MM-DD'T'HH:mm'Z'
   *     * YYYY-MM-DD'T'HH:mm+XX:XX
   *     * YYYY-MM-DD'T'HH:mm-XX:XX
   *
   *     All other formats may be ignored by the system.
   *      */
  fromDate?: string;
  /** @description Date and time in RFC3339 format after which Items (Checkouts or Commerce-Cases, depending on the context) should be included in the request.
   *     Accepted formats are:
   *     * YYYY-MM-DD'T'HH:mm:ss'Z'
   *     * YYYY-MM-DD'T'HH:mm:ss+XX:XX
   *     * YYYY-MM-DD'T'HH:mm:ss-XX:XX
   *     * YYYY-MM-DD'T'HH:mm'Z'
   *     * YYYY-MM-DD'T'HH:mm+XX:XX
   *     * YYYY-MM-DD'T'HH:mm-XX:XX
   *     All other formats may be ignored by the system.
   *      */
  toDate?: string;
}

export interface GetCheckoutsQueryParams extends BaseQueryParams {
  /**
   * @description Minimum monetary value of the Checkouts that shall be included in the response. Amount in cents always
   *     having 2 decimals.
   * @example 1000
   */
  fromCheckoutAmount?: number;
  /**
   * @description Maximum monetary value of the Checkouts that shall be included in the response. Amount in cents always
   *     having 2 decimals.
   * @example 1000
   */
  toCheckoutAmount?: number;
  /**
   * @description Minimum open amount of the Checkouts that shall be included in the response. Amount in cents always having
   *     2 decimals.
   * @example 1000
   */
  fromOpenAmount?: number;
  /**
   * @description Maximum open amount of the Checkouts that shall be included in the response. Amount in cents always having 2
   *     decimals.
   * @example 1000
   */
  toOpenAmount?: number;
  /**
   * @description Minimum collected amount of the Checkouts that shall be included in the response. Amount in cents always
   *     having 2 decimals.
   * @example 1000
   */
  fromCollectedAmount?: number;
  /**
   * @description Maximum collected amount of the Checkouts that shall be included in the response. Amount in cents always
   *     having 2 decimals.
   * @example 1000
   */
  toCollectedAmount?: number;
  /**
   * @description Minimum cancelled amount of the Checkouts that shall be included in the response. Amount in cents always
   *     having 2 decimals.
   * @example 1000
   */
  fromCancelledAmount?: number;
  /**
   * @description Maximum cancelled amount of the Checkouts that shall be included in the response. Amount in cents always
   *     having 2 decimals.
   * @example 1000
   */
  toCancelledAmount?: number;
  /**
   * @description Minimum refunded amount of the Checkouts that shall be included in the response. Amount in cents always having
   *     2 decimals.
   * @example 1000
   */
  fromRefundAmount?: number;
  /**
   * @description Maximum refunded amount of the Checkouts that shall be included in the response. Amount in cents always having
   *     2 decimals.
   * @example 1000
   */
  toRefundAmount?: number;
  /**
   * @description Minimum chargeback amount of the Checkouts that shall be included in the response. Amount in cents always
   *     having 2 decimals.
   * @example 1000
   */
  fromChargebackAmount?: number;
  /**
   * @description Maximum chargeback amount of the Checkouts that shall be included in the response. Amount in cents always
   *     having 2 decimals.
   * @example 1000
   */
  toChargebackAmount?: number;
  /**
   * @description Unique identifier of a Checkout
   * @example 7a3444d3-f6ce-4b6e-b6c4-2486a160cf19
   */
  checkoutId?: string;
  /**
   * @description Unique reference of the Checkout that is also returned for reporting and reconciliation purposes.
   * @example your-checkout-6372
   */
  merchantReference?: string;
  /**
   * @description Unique identifier for the customer.
   * @example 1234
   */
  merchantCustomerId?: string;
  /** @description Filter your results by payment product ID so that only Checkouts containing a Payment Execution with one of
   *     the specified payment product IDs are returned. */
  includePaymentProductId?: number[];
  /** @description Filter your results by Checkout status so that only Checkouts with the specified statuses are returned. */
  includeCheckoutStatus?: StatusCheckout[];
  /** @description Filter your results by extended Checkout status so that only Checkouts with the specified statuses are returned. */
  includeExtendedCheckoutStatus?: ExtendedCheckoutStatus[];
  /** @description Filter your results by payment channel so that only Checkouts which reference transactions on the given
   *     channels are returned. */
  includePaymentChannel?: PaymentChannel[];
  /**
   * @description Filter your results by the merchantReference of the paymentExecution or paymentInformation.
   * @example Reference-4172
   */
  paymentReference?: string;
  /**
   * @description Filter your results by the paymentExecutionId, paymentInformationId or the id of the payment.
   * @example 664423132
   */
  paymentId?: string;
  /**
   * @description Filter your results by the customer first name. It is also possible to filter by the first name from the
   *     shipping address.
   * @example Sinclair
   */
  firstName?: string;
  /**
   * @description Filter your results by the customer surname. It is also possible to filter by the surname from the shipping
   *     address.
   * @example Müller
   */
  surname?: string;
  /**
   * @description Filter your results by the customer email address.
   * @example Sinclair.Müller@example.com
   */
  email?: string;
  /**
   * @description Filter your results by the customer phone number.
   * @example +1234567890
   */
  phoneNumber?: string;
  /**
   * @description Filter your results by the date of birth.
   *     Format YYYYMMDD
   * @example 20041101
   */
  dateOfBirth?: string;
  /**
   * @description Filter your results by the name of the company.
   * @example Sinclair's company name
   */
  companyInformation?: string;
}

export interface GetCommerceCasesQueryParams extends BaseQueryParams {
  /**
   * @description Unique identifier of a Commerce Case.
   * @example 7a3444d3-f6ce-4b6e-b6c4-2486a160cf19
   */
  commerceCaseId?: string;
  /**
   * @description Unique reference of the Checkout that is also returned for reporting and reconciliation purposes.
   * @example your-checkout-6372
   */
  merchantReference?: string;
  /**
   * @description Unique identifier for the customer.
   * @example 1234
   */
  merchantCustomerId?: string;
  /** @description Filter your results by Checkout status so that only Checkouts with the specified statuses are returned. */
  includeCheckoutStatus?: StatusCheckout[];
  /** @description Filter your results by payment channel so that only Checkouts which reference transactions on the given channels are returned. */
  includePaymentChannel?: PaymentChannel[];
}
