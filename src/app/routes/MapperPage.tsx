import interact from 'interactjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEventHandler } from 'react';
import { Link } from 'react-router-dom';
import { PdfCanvasPage } from '../../components/PdfCanvasPage';
import { rect01ToPx, rectPxTo01 } from '../../lib/coords';
import { checkAssets } from '../../lib/assets';
import type { FieldDef, FieldType, FieldsFile, Rect01 } from '../../lib/schema';
import { defaultFieldsFile } from '../../lib/schema';

const makeFieldId = (page: number, type: FieldType, fields: FieldDef[]) => {
  const used = fields
    .filter((f) => f.page === page && f.type === type)
    .map((f) => {
      const parts = f.id.split('_');
      return Number(parts[parts.length - 1]) || 0;
    });
  const next = (Math.max(0, ...used) + 1).toString().padStart(3, '0');
  return `p${page}_${type}_${next}`;
};

export function MapperPage() {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [fieldsFile, setFieldsFile] = useState<FieldsFile>(defaultFieldsFile);
  const [page, setPage] = useState(2);
  const [type, setType] = useState<FieldType>('text');
  const [preview, setPreview] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [anchorMode, setAnchorMode] = useState(false);
  const [gridRows, setGridRows] = useState(1);
  const [gridCols, setGridCols] = useState(4);
  const [spacingX, setSpacingX] = useState(24);
  const [spacingY, setSpacingY] = useState(24);
  const layerRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    (async () => {
      const { missing } = await checkAssets(['/forms/cva.pdf', '/fields/fields.json']);
      if (missing.length) {
        setAssetError(`缺少必要資產：${missing.join(', ')}。請將 cva.pdf 放入 public/forms/。`);
        return;
      }
      const res = await fetch('/fields/fields.json');
      if (!res.ok) {
        setAssetError('fields.json 無法讀取，請確認 public/fields/fields.json。');
        return;
      }
      setFieldsFile((await res.json()) as FieldsFile);
    })().catch(() => setAssetError('載入 mapper 資產失敗。'));
  }, []);

  const pageFields = useMemo(() => fieldsFile.fields.filter((f) => f.page === page), [fieldsFile.fields, page]);
  const selectedField = useMemo(() => fieldsFile.fields.find((f) => f.id === selected), [fieldsFile.fields, selected]);
  const showGridPanel = type === 'checkbox' || selectedField?.type === 'checkbox';

  const deleteSelectedField = useCallback(() => {
    if (!selected) return;
    const target = fieldsFile.fields.find((f) => f.id === selected);
    if (!target) return;
    if (!window.confirm(`確定刪除欄位 ${target.id} 嗎？`)) return;
    setFieldsFile((prev) => ({ ...prev, fields: prev.fields.filter((f) => f.id !== selected) }));
    setSelected(null);
  }, [fieldsFile.fields, selected]);

  const updateRect = useCallback((id: string, rect: Rect01) => {
    setFieldsFile((prev) => ({ ...prev, fields: prev.fields.map((f) => (f.id === id ? { ...f, rect } : f)) }));
  }, []);

  useEffect(() => {
    pageFields.forEach((field) => {
      const element = boxRefs.current[field.id];
      if (!element || viewport.width === 0) return;

      interact(element)
        .draggable({
          listeners: {
            move: (event) => {
              const targetId = (event.target as HTMLElement).dataset.fieldId;
              if (!targetId) return;
              const current = fieldsFile.fields.find((f) => f.id === targetId);
              if (!current) return;
              const px = rect01ToPx(current.rect, viewport.width, viewport.height);
              const rect = {
                left: px.left + event.dx,
                top: px.top + event.dy,
                width: px.width,
                height: px.height
              };
              updateRect(targetId, rectPxTo01(rect, viewport.width, viewport.height));
            }
          }
        })
        .resizable({
          margin: 12,
          edges: { left: true, right: true, top: true, bottom: true },
          listeners: {
            move: (event) => {
              const targetId = (event.target as HTMLElement).dataset.fieldId;
              if (!targetId) return;
              const current = fieldsFile.fields.find((f) => f.id === targetId);
              if (!current) return;
              const px = rect01ToPx(current.rect, viewport.width, viewport.height);
              const rect = {
                left: px.left + event.deltaRect.left,
                top: px.top + event.deltaRect.top,
                width: event.rect.width,
                height: event.rect.height
              };
              updateRect(targetId, rectPxTo01(rect, viewport.width, viewport.height));
            }
          }
        });
    });
    return () => {
      interact('.mapper-field').unset();
    };
  }, [fieldsFile.fields, pageFields, updateRect, viewport.height, viewport.width]);

  const addField = (rect: Rect01, fieldType: FieldType) => {
    const id = makeFieldId(page, fieldType, fieldsFile.fields);
    const template = selected ? fieldsFile.fields.find((f) => f.id === selected) : fieldsFile.fields[fieldsFile.fields.length - 1];
    const field: FieldDef = {
      id,
      page,
      type: fieldType,
      rect,
      fontSize: template?.fontSize ?? 10,
      maxLines: template?.maxLines ?? 4,
      hitPadding: template?.hitPadding ?? 10,
      valueAnchor: fieldType === 'slider' ? template?.valueAnchor : undefined
    };
    setFieldsFile((prev) => ({ ...prev, fields: [...prev.fields, field] }));
    setSelected(id);
  };

  const onLayerMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
    if (anchorMode) return;
    if (!(e.target as HTMLElement).classList.contains('field-layer')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const onLayerMouseUp: MouseEventHandler<HTMLDivElement> = (e) => {
    if (anchorMode || !dragStart || viewport.width === 0 || viewport.height === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const end = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const left = Math.min(dragStart.x, end.x);
    const top = Math.min(dragStart.y, end.y);
    const width = Math.max(8, Math.abs(end.x - dragStart.x));
    const height = Math.max(8, Math.abs(end.y - dragStart.y));
    addField(rectPxTo01({ left, top, width, height }, viewport.width, viewport.height), type);
    setDragStart(null);
  };

  const setSliderAnchor: MouseEventHandler<HTMLDivElement> = (e) => {
    if (!anchorMode || !selected || !layerRef.current) return;
    const selectedField = fieldsFile.fields.find((f) => f.id === selected && f.type === 'slider');
    if (!selectedField || viewport.width === 0 || viewport.height === 0) return;
    const rect = layerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / viewport.width;
    const y = (e.clientY - rect.top) / viewport.height;
    setFieldsFile((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === selectedField.id ? { ...f, valueAnchor: { x, y } } : f))
    }));
    setAnchorMode(false);
  };

  const addGrid = () => {
    const base = fieldsFile.fields.find((f) => f.id === selected && f.type === 'checkbox');
    if (!base || viewport.width === 0 || viewport.height === 0) return;
    const spacingX01 = spacingX / viewport.width;
    const spacingY01 = spacingY / viewport.height;
    const next: FieldDef[] = [];
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        if (r === 0 && c === 0) continue;
        next.push({
          ...base,
          id: makeFieldId(page, 'checkbox', [...fieldsFile.fields, ...next]),
          rect: {
            ...base.rect,
            x: base.rect.x + c * spacingX01,
            y: base.rect.y + r * spacingY01
          }
        });
      }
    }
    setFieldsFile((prev) => ({ ...prev, fields: [...prev.fields, ...next] }));
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(fieldsFile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fields.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!selected) return;
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) return;
      event.preventDefault();
      deleteSelectedField();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [deleteSelectedField, selected]);

  return (
    <div className="app-shell">
      <div className="topbar">
        <select value={page} onChange={(e) => setPage(Number(e.target.value))}>{[1, 2, 3, 4, 5].map((p) => <option key={p} value={p}>頁 {p}</option>)}</select>
        <select value={type} onChange={(e) => setType(e.target.value as FieldType)}>
          <option value="text">text</option>
          <option value="checkbox">checkbox</option>
          <option value="slider">slider</option>
        </select>
        <button onClick={exportJson}>Export fields.json</button>
        <label><input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} />Preview</label>
        <label>Import<input type="file" accept="application/json" onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setFieldsFile(JSON.parse(await file.text()) as FieldsFile);
        }} /></label>
        {showGridPanel && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <strong>批量產生（Grid）</strong>
            <span style={{ fontSize: 12, color: '#374151' }}>用來一次產生多個 checkbox（例如一排 4 格）。</span>
            <span style={{ fontSize: 12, color: '#374151' }}>以目前選取 checkbox 為左上角基準；間距單位為 px。</span>
            <label>列(rows) <input type="number" min={1} placeholder="例:1" value={gridRows} onChange={(e) => setGridRows(Number(e.target.value) || 1)} /></label>
            <label>欄(cols) <input type="number" min={1} placeholder="例:4" value={gridCols} onChange={(e) => setGridCols(Number(e.target.value) || 1)} /></label>
            <label>水平間距 spacingX(px) <input type="number" min={0} step="1" placeholder="例:24" value={spacingX} onChange={(e) => setSpacingX(Number(e.target.value) || 0)} /></label>
            <label>垂直間距 spacingY(px) <input type="number" min={0} step="1" placeholder="例:24" value={spacingY} onChange={(e) => setSpacingY(Number(e.target.value) || 0)} /></label>
            <button onClick={addGrid} disabled={selectedField?.type !== 'checkbox'}>Generate</button>
          </div>
        )}
        <button onClick={deleteSelectedField} disabled={!selectedField}>Delete</button>
        <button onClick={() => setAnchorMode(true)} disabled={!fieldsFile.fields.find((f) => f.id === selected && f.type === 'slider')}>設定 Slider Anchor</button>
        <Link to="/">回表單</Link>
      </div>

      {assetError && <div className="error-banner">{assetError}</div>}
      {anchorMode && <div className="hint-banner">請在頁面上點一下設定 valueAnchor（0..1）</div>}

      {!assetError && (
        <div className="canvas-wrap">
          <PdfCanvasPage pageNumber={page} pdfPath="/forms/cva.pdf" onViewport={setViewport} />
          <div
            ref={layerRef}
            className="field-layer"
            style={{ width: viewport.width, height: viewport.height }}
            onMouseDown={onLayerMouseDown}
            onMouseUp={onLayerMouseUp}
            onClick={setSliderAnchor}
          >
            {pageFields.map((field) => {
              const px = rect01ToPx(field.rect, viewport.width, viewport.height);
              return (
                <div
                  key={field.id}
                  data-field-id={field.id}
                  ref={(node) => {
                    boxRefs.current[field.id] = node;
                  }}
                  className="field-box mapper-field"
                  style={{
                    left: px.left,
                    top: px.top,
                    width: px.width,
                    height: px.height,
                    outline: selected === field.id ? '2px solid #ef4444' : undefined,
                    zIndex: selected === field.id ? 2 : 1
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(field.id);
                  }}
                >
                  {selected === field.id && (
                    <span style={{ fontSize: 10, pointerEvents: 'none', background: 'rgba(255,255,255,0.9)', padding: '0 2px' }}>
                      {preview ? field.type : field.id}
                    </span>
                  )}
                  {field.type === 'slider' && field.valueAnchor && (
                    <span style={{ position: 'absolute', left: `${field.valueAnchor.x * 100}%`, top: `${field.valueAnchor.y * 100}%` }}>•</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
