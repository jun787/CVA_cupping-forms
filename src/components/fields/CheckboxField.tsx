import type { CSSProperties } from 'react';

type Props = {
  style: CSSProperties;
  checked: boolean;
  hitPadding: number;
  onToggle: () => void;
};

export function CheckboxField({ style, checked, hitPadding, onToggle }: Props) {
  return (
    <div
      style={{ ...style, padding: hitPadding, margin: -hitPadding, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onToggle}
    >
      <div style={{ width: style.width, height: style.height, border: '1px solid #111', background: checked ? 'rgba(37,99,235,0.15)' : 'transparent' }} />
    </div>
  );
}
