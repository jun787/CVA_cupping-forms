import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PdfCanvasPage } from '../../components/PdfCanvasPage';
import { FieldLayer } from '../../components/FieldLayer';
import { useFormStore } from '../../store/useFormStore';
import type { FieldsFile } from '../../lib/schema';
import { defaultFieldsFile } from '../../lib/schema';
import { exportPdf } from '../../lib/exportPdf';
import { checkAssets } from '../../lib/assets';

const pageNames: Record<number, string> = { 1: '綜合', 2: '描述性', 3: '情感性', 4: '外在', 5: '物理性' };

const toArrayBuffer = (u8: Uint8Array) =>
  u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);

export function FormPage() {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [fieldsFile, setFieldsFile] = useState<FieldsFile>(defaultFieldsFile);
  const [showSessions, setShowSessions] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const store = useFormStore();
  const currentSession = useMemo(() => store.sessions.find((s) => s.id === store.currentSessionId), [store.sessions, store.currentSessionId]);

  useEffect(() => {
    store.loadSessions();
  }, [store]);

  useEffect(() => {
    (async () => {
      const { missing } = await checkAssets(['/forms/cva.pdf', '/fonts/msjh.ttf', '/fields/fields.json']);
      if (missing.length) {
        setAssetError(`缺少必要資產：${missing.join(', ')}。請將 cva.pdf 放入 public/forms/，msjh.ttf 放入 public/fonts/。`);
        return;
      }
      const res = await fetch('/fields/fields.json');
      if (!res.ok) {
        setAssetError('fields.json 無法讀取，請確認 public/fields/fields.json 存在。');
        return;
      }
      setFieldsFile((await res.json()) as FieldsFile);
    })().catch(() => {
      setAssetError('資產載入失敗，請確認 public/forms/cva.pdf 與 public/fonts/msjh.ttf。');
    });
  }, []);

  useEffect(() => {
    if (!store.currentSessionId && store.sessions.length === 0) {
      store.createSession();
    }
  }, [store]);

  const doExport = async () => {
    if (!currentSession || assetError) return;
    const bytes = await exportPdf(currentSession, fieldsFile.fields, '/forms/cva.pdf', '/fonts/msjh.ttf');
    if (bytes.length === 0) {
      window.alert('目前沒有已填寫欄位，無可匯出頁面。');
      return;
    }
    const blob = new Blob([toArrayBuffer(bytes)], { type: 'application/pdf' });
    const file = new File([blob], `cva-${currentSession.title}.pdf`, { type: 'application/pdf' });
    if ((navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({ files: [file], title: file.name });
        return;
      } catch {
        // fallback download
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <select value={store.currentPage} onChange={(e) => store.setCurrentPage(Number(e.target.value))}>
          {Object.entries(pageNames).map(([num, name]) => (
            <option key={num} value={num}>{name}</option>
          ))}
        </select>
        <button onClick={() => setShowSessions((v) => !v)}>Sessions</button>
        <button onClick={doExport} disabled={!!assetError}>匯出 PDF</button>
        <Link to="/mapper">/mapper</Link>
      </div>

      {assetError && <div className="error-banner">{assetError}</div>}
      {renderError && <div className="error-banner">PDF 渲染錯誤：{renderError}</div>}

      {showSessions && (
        <div style={{ background: 'white', padding: 8, marginTop: 8 }}>
          <button onClick={() => store.createSession()}>新增</button>
          <div className="session-list">
            {store.sessions.map((s) => (
              <div key={s.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button onClick={() => store.selectSession(s.id)}>{s.id === store.currentSessionId ? '✅' : '開啟'}</button>
                <input value={s.title} onChange={(e) => s.id === store.currentSessionId && store.updateSessionMeta({ title: e.target.value })} />
                <button onClick={() => store.duplicateSession(s.id)}>複製</button>
                <button onClick={() => store.removeSession(s.id)}>刪除</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!assetError && (
        <div className="canvas-wrap">
          <PdfCanvasPage pageNumber={store.currentPage} pdfPath="/forms/cva.pdf" onViewport={setViewport} onError={setRenderError} />
          {currentSession && viewport.width > 0 && (
            <FieldLayer
              fields={fieldsFile.fields}
              page={store.currentPage}
              viewport={viewport}
              values={currentSession.values}
              onUpdate={(id, value) => store.updateValue(id, value)}
            />
          )}
        </div>
      )}
    </div>
  );
}
