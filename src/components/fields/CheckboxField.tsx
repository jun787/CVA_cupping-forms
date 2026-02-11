import type { CSSProperties } from 'react';

type Props = {
  style: CSSProperties;
  checked: boolean;
  hitPadding: number;
  onToggle: () => void;
};

export function CheckboxField({ style, checked, hitPadding, onToggle }: Props) {
  return (
    <button
      type="button"
      style={{ ...style, padding: hitPadding, margin: -hitPadding, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      onClick={onToggle}
    >
      <div style={{ width: style.width, height: style.height, border: '1px solid #111', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
        {checked ? '✓' : ''}
      </div>
    </button>
  );
}
