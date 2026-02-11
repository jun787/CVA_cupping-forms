import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

type Props = {
  fieldId: string;
  style: CSSProperties;
  value: string;
  fontSizePx: number;
  maxLines?: number;
  onChange: (value: string) => void;
};

export function TextField({ fieldId, style, value, fontSizePx, maxLines = 4, onChange }: Props) {
  const [draft, setDraft] = useState(value);
  const isComposingRef = useRef(false);

  useEffect(() => {
    if (!isComposingRef.current) {
      setDraft(value);
    }
  }, [fieldId, value]);

  const height = Number(style.height ?? 0);
  const lineHeightPx = fontSizePx * 1.2;
  const visibleLines = Math.max(1, Math.min(maxLines, draft.split('\n').length || 1));
  const blockHeight = visibleLines * lineHeightPx;
  const paddingTop = Math.max(2, (height - blockHeight) / 2);

  return (
    <textarea
      style={{
        ...style,
        fontSize: fontSizePx,
        lineHeight: `${lineHeightPx}px`,
        textAlign: 'left',
        fontWeight: 700,
        paddingTop,
        paddingBottom: 2,
        paddingLeft: 4,
        paddingRight: 2
      }}
      value={draft}
      onCompositionStart={() => {
        isComposingRef.current = true;
      }}
      onCompositionEnd={(e) => {
        isComposingRef.current = false;
        const next = e.currentTarget.value;
        setDraft(next);
        onChange(next);
      }}
      onChange={(e) => {
        const next = e.target.value;
        setDraft(next);
        if (!isComposingRef.current) {
          onChange(next);
        }
      }}
    />
  );
}
