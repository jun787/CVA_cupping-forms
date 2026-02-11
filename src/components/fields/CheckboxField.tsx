import type { CSSProperties } from 'react';

type Props = {
  style: CSSProperties;
  checked: boolean;
  hitPadding: number;
  onToggle: () => void;
};

export function CheckboxField({ style, checked, hitPadding, onToggle }: Props) {
  const left = Number(style.left ?? 0);
  const top = Number(style.top ?? 0);
  const width = Number(style.width ?? 0);
  const height = Number(style.height ?? 0);

  return (
    <button
      type="button"
      aria-pressed={checked}
      style={{
        position: 'absolute',
        left: left - hitPadding,
        top: top - hitPadding,
        width: width + hitPadding * 2,
        height: height + hitPadding * 2,
        border: 'none',
        background: 'transparent',
        padding: 0,
        margin: 0,
        cursor: 'pointer'
      }}
      onClick={onToggle}
    >
      <div
        style={{
          position: 'absolute',
          left: hitPadding,
          top: hitPadding,
          width,
          height,
          border: '1px solid #111',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          fontSize: Math.max(10, Math.min(height, width) * 0.95)
        }}
      >
        {checked ? '✓' : ''}
      </div>
    </button>
  );
}
