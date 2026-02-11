import type { FieldDef, FieldValues } from '../lib/schema';
import { rect01ToPx } from '../lib/coords';
import { TextField } from './fields/TextField';
import { CheckboxField } from './fields/CheckboxField';
import { SliderField } from './fields/SliderField';

type Props = {
  fields: FieldDef[];
  page: number;
  viewport: { width: number; height: number; cssScale?: number };
  values: FieldValues;
  onUpdate: (fieldId: string, value: string | boolean | number | null) => void;
};

export function FieldLayer({ fields, page, viewport, values, onUpdate }: Props) {
  return (
    <div className="field-layer" style={{ width: viewport.width, height: viewport.height }}>
      {fields.filter((f) => f.page === page).map((field) => {
        const px = rect01ToPx(field.rect, viewport.width, viewport.height);
        const baseStyle = { left: px.left, top: px.top, width: px.width, height: px.height, position: 'absolute' as const };
        const value = values[field.id];
        if (field.type === 'checkbox') {
          return (
            <div key={field.id} className="field-box">
              <CheckboxField
                style={baseStyle}
                checked={value === true}
                hitPadding={field.hitPadding ?? 10}
                onToggle={() => onUpdate(field.id, value === true ? false : true)}
              />
            </div>
          );
        }
        if (field.type === 'slider') {
          return <SliderField key={field.id} style={baseStyle} value={typeof value === 'number' ? value : null} onChange={(v) => onUpdate(field.id, v)} />;
        }
        const fontSizePt = field.fontSizePt ?? field.fontSize ?? 10;
        const fontSizePx = fontSizePt * (viewport.cssScale ?? 1);
        return <TextField key={field.id} style={baseStyle} fontSizePx={fontSizePx} value={typeof value === 'string' ? value : ''} onChange={(v) => onUpdate(field.id, v)} />;
      })}
    </div>
  );
}
