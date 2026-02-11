import type { CSSProperties } from 'react';

type Props = {
  style: CSSProperties;
  checked: boolean;
  hitPadding?: number;
  onToggle: () => void;
};

export function CheckboxField({ style, checked, hitPadding, onToggle }: Props) {
  const left = Number(style.left ?? 0);
  const top = Number(style.top ?? 0);
  const width = Number(style.width ?? 0);
  const height = Number(style.height ?? 0);
  const baseHit = typeof hitPadding === 'number' ? hitPadding : 3;
  const maxHit = Math.floor(Math.min(width, height) * 0.25);
  const hit = Math.max(0, Math.min(baseHit, maxHit));

  return (
    <button
      type="button"
      aria-pressed={checked}
      style={{
        position: 'absolute',
        left: left - hit,
        top: top - hit,
        width: width + hit * 2,
        height: height + hit * 2,
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
          left: hit,
          top: hit,
          width,
          height,
          border: '1px solid #111',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          fontSize: Math.max(10, Math.min(height, width) * 0.95),
          pointerEvents: 'none'
        }}
      >
        {checked ? '✓' : ''}
      </div>
    </button>
  );
}
