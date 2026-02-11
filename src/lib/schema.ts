export type FieldType = 'text' | 'checkbox' | 'slider';

export type Rect01 = { x: number; y: number; w: number; h: number };
export type Point01 = { x: number; y: number };

export type FieldDef = {
  id: string;
  page: number;
  type: FieldType;
  rect: Rect01;
  fontSize?: number;
  fontSizePt?: number;
  maxLines?: number;
  hitPadding?: number;
  valueAnchor?: Point01;
};

export type FieldsFile = {
  version: 1;
  defaults: {
    textFontSize: number;
    textMaxLines: number;
    checkboxHitPadding: number;
    sliderFontSize: number;
  };
  fields: FieldDef[];
};

export type FieldValues = Record<string, string | boolean | number | null>;

export const defaultFieldsFile: FieldsFile = {
  version: 1,
  defaults: {
    textFontSize: 10,
    textMaxLines: 4,
    checkboxHitPadding: 10,
    sliderFontSize: 10
  },
  fields: []
};
