import type { CSSProperties } from 'react';

type Props = {
  style: CSSProperties;
  value: number | null;
  onChange: (value: number | null) => void;
};

export function SliderField({ style, value, onChange }: Props) {
  return (
    <div style={style}>
      <input
        className="slider-input"
        type="range"
        min={0}
        max={15}
        step={0.5}
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div style={{ fontSize: 11 }}>{value === null ? '未填' : value}</div>
      <button type="button" onClick={() => onChange(null)}>清除</button>
    </div>
  );
}
