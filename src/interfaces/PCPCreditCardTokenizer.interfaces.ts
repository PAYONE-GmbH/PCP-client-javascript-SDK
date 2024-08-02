export interface FieldConfig {
  selector: string;
  element?: HTMLElement;
  size?: string;
  maxlength?: string;
  length?: { [key: string]: number };
  type: string;
  style?: string;
  styleFocus?: string;
  iframe?: { width?: string; height?: string };
}

export interface CardtypeFieldConfig
  extends Omit<FieldConfig, 'type' | 'length'> {
  cardtypes: string[];
}

export interface Style {
  input: string;
  inputFocus: string;
  select: string;
  iframe: {
    height?: string;
    width?: string;
  };
}

export interface AutoCardtypeDetection {
  supportedCardtypes: string[];
  callback: (detectedCardtype: string) => void;
  deactivate?: boolean;
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
  submitButtonId: string;
  submitButtonWithOutCompleteCheckId?: string;
  ccIcons?: {
    selector: string;
    mapCardtypeToSelector?: Partial<Record<Cardtype, string>>;
    style?: {
      [key: string]: string | undefined;
      height?: string;
      width?: string;
    };
  };
  error?: string;
  creditCardCheckCallback: (response: {
    [key: string]: string;
    status: string;
    pseudocardpan: string;
    truncatedcardpan: string;
    cardtype: string;
    cardexpiredate: string;
  }) => void;
  formNotCompleteCallback?: () => void;
}
export type Cardtype = 'V' | 'M' | 'A' | 'D' | 'J' | 'O' | 'P' | 'U' | 'G';
