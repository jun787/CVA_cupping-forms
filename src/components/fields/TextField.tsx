import type { CSSProperties } from 'react';

type Props = {
  style: CSSProperties;
  value: string;
  fontSizePx: number;
  onChange: (value: string) => void;
};

export function TextField({ style, value, fontSizePx, onChange }: Props) {
  return <textarea style={{ ...style, fontSize: fontSizePx, lineHeight: 1.2, padding: 2 }} value={value} onChange={(e) => onChange(e.target.value)} />;
}
