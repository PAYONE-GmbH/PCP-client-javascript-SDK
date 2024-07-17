export interface FieldConfig {
  selector?: string;
  element?: HTMLElement;
  size?: string;
  maxlength?: string;
  length?: { [key: string]: number };
  type: string;
  style?: string;
  styleFocus?: string;
  iframe?: { width?: string; height?: string };
}

export interface CardTypeFieldConfig
  extends Omit<FieldConfig, 'type' | 'length'> {
  cardtypes: string[];
}

export interface Style {
  input: string;
  inputFocus: string;
  select: string;
  iframe: {
    height: string;
    width: string;
  };
}

export interface AutoCardTypeDetection {
  supportedCardtypes: string[];
  callback: (detectedCardtype: string) => void;
  deactivate?: boolean;
}

export interface Config {
  fields: {
    cardtype?: CardTypeFieldConfig;
    cardpan: FieldConfig;
    cardcvc2: FieldConfig;
    cardexpiremonth: FieldConfig;
    cardexpireyear: FieldConfig;
  };
  defaultStyle: Style;
  autoCardtypeDetection: AutoCardTypeDetection;
  language: string;
  error?: string;
}
