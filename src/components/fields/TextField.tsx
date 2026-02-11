import type { CSSProperties } from 'react';

type Props = {
  style: CSSProperties;
  value: string;
  onChange: (value: string) => void;
};

export function TextField({ style, value, onChange }: Props) {
  return <textarea style={style} value={value} onChange={(e) => onChange(e.target.value)} />;
}
