// https://developers.google.com/pay/api/web/guides/brand-guidelines#custom-button
export type GooglePayButtonConfig = google.payments.api.ButtonOptions;

export interface GooglePayButton {
  /**
   * The selector for the container element in which to display the Google Pay button.
   */
  selector: string;
  config: GooglePayButtonConfig;
}
