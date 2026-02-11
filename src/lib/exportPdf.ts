import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { getDocument } from './pdfjs';
import { detectFilledPages } from './detectFilledPages';
import { point01ToPdf, rect01ToPdf } from './coords';
import { wrapTextWithEllipsis } from './textWrap';
import type { FieldDef, FieldValues } from './schema';

const renderPageToPngBytes = async (page: any, scale = 2.2): Promise<Uint8Array> => {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  await page.render({ canvasContext: ctx, viewport }).promise;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('PNG 轉換失敗'));
    }, 'image/png');
  });
  return new Uint8Array(await blob.arrayBuffer());
};

export const exportPdf = async (
  session: { values: FieldValues },
  fields: FieldDef[],
  pdfAssetPath: string,
  fontAssetPath: string
): Promise<Uint8Array> => {
  const filledPages = detectFilledPages(fields, session.values);
  if (filledPages.length === 0) return new Uint8Array();

  const pdfRes = await fetch(pdfAssetPath, { method: 'HEAD' });
  const fontRes = await fetch(fontAssetPath, { method: 'HEAD' });
  if (!pdfRes.ok || !fontRes.ok) {
    throw new Error('匯出失敗：缺少 cva.pdf 或 msjh.ttf 資產');
  }

  const srcPdf = await getDocument(pdfAssetPath).promise;
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fontBytes = await fetch(fontAssetPath).then((r) => r.arrayBuffer());
  const font = await doc.embedFont(fontBytes, { subset: true });

  for (const pageNo of filledPages) {
    const page = await srcPdf.getPage(pageNo);
    const baseViewport = page.getViewport({ scale: 1 });
    const pageW = baseViewport.width;
    const pageH = baseViewport.height;

    const pngBytes = await renderPageToPngBytes(page);
    const png = await doc.embedPng(pngBytes);
    const pdfPage = doc.addPage([pageW, pageH]);
    pdfPage.drawImage(png, { x: 0, y: 0, width: pageW, height: pageH });

    fields.filter((f) => f.page === pageNo).forEach((field) => {
      const value = session.values[field.id];
      if (field.type === 'checkbox') {
        if (value === true) {
          const rect = rect01ToPdf(field.rect, pageW, pageH);
          const checkSize = Math.max(9, Math.min(rect.height, rect.width) * 0.95);
          pdfPage.drawText('✓', {
            x: rect.x + 1,
            y: rect.y + Math.max(0, (rect.height - checkSize) / 2),
            size: checkSize,
            font,
            color: rgb(0, 0, 0)
          });
        }
        return;
      }
      if (field.type === 'slider') {
        if (typeof value === 'number' && field.valueAnchor) {
          const p = point01ToPdf(field.valueAnchor, pageW, pageH);
          pdfPage.drawText(String(value), { x: p.x, y: p.y, size: field.fontSize ?? 10, font, color: rgb(0, 0, 0) });
        }
        return;
      }
      if (field.type === 'text' && typeof value === 'string' && value.trim()) {
        const rect = rect01ToPdf(field.rect, pageW, pageH);
        const fontSizePt = field.fontSizePt ?? field.fontSize ?? 10;
        const lineHeightPt = fontSizePt * 1.2;
        const paddingPt = 2;
        const lines = wrapTextWithEllipsis(value, font, fontSizePt, Math.max(0, rect.width - paddingPt * 2), field.maxLines ?? 4);
        const blockHeightPt = lines.length * lineHeightPt;
        let y = rect.y + Math.max(0, (rect.height - blockHeightPt) / 2) + blockHeightPt - lineHeightPt + fontSizePt * 0.1;
        lines.forEach((line) => {
          pdfPage.drawText(line, { x: rect.x + paddingPt, y, size: fontSizePt, font, color: rgb(0, 0, 0) });
          y -= lineHeightPt;
        });
      }
    });
  }

  return doc.save();
};
