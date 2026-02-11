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
  const fontSizePx = Math.max(10, Math.floor(height * 0.9));

  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      style={{
        position: 'absolute',
        left: left - hitPadding,
        top: top - hitPadding,
        width: width + hitPadding * 2,
        height: height + hitPadding * 2,
        background: 'transparent',
        cursor: 'pointer'
      }}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: hitPadding,
          top: hitPadding,
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {checked && (
          <span style={{ pointerEvents: 'none', fontSize: fontSizePx, fontWeight: 700, lineHeight: 1 }}>
            ✓
          </span>
        )}
      </div>
    </div>
  );
}
