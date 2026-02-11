import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { getDocument } from './pdfjs';
import { detectFilledPages } from './detectFilledPages';
import { point01ToPdf, rect01ToPdf } from './coords';
import { wrapTextWithEllipsis } from './textWrap';
import type { FieldDef, FieldValues } from './schema';

const renderPageToPngBytes = async (pdf: any, pageNumber: number, scale = 2.2): Promise<Uint8Array> => {
  const page = await pdf.getPage(pageNumber);
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
    const pngBytes = await renderPageToPngBytes(srcPdf, pageNo);
    const png = await doc.embedPng(pngBytes);
    const pdfPage = doc.addPage([png.width, png.height]);
    pdfPage.drawImage(png, { x: 0, y: 0, width: png.width, height: png.height });

    fields.filter((f) => f.page === pageNo).forEach((field) => {
      const value = session.values[field.id];
      if (field.type === 'checkbox') {
        if (value === true) {
          const rect = rect01ToPdf(field.rect, png.width, png.height);
          pdfPage.drawText('✓', {
            x: rect.x + 1,
            y: rect.y + 1,
            size: field.fontSize ?? 11,
            font,
            color: rgb(0, 0, 0)
          });
        }
        return;
      }
      if (field.type === 'slider') {
        if (typeof value === 'number' && field.valueAnchor) {
          const p = point01ToPdf(field.valueAnchor, png.width, png.height);
          pdfPage.drawText(String(value), { x: p.x, y: p.y, size: field.fontSize ?? 10, font, color: rgb(0, 0, 0) });
        }
        return;
      }
      if (field.type === 'text' && typeof value === 'string' && value.trim()) {
        const rect = rect01ToPdf(field.rect, png.width, png.height);
        const fontSize = field.fontSize ?? 10;
        const lines = wrapTextWithEllipsis(value, font, fontSize, rect.width, field.maxLines ?? 4);
        const lineHeight = fontSize * 1.2;
        lines.forEach((line, index) => {
          const y = rect.y + rect.height - lineHeight * (index + 1);
          if (y >= rect.y) {
            pdfPage.drawText(line, { x: rect.x, y, size: fontSize, font, color: rgb(0, 0, 0) });
          }
        });
      }
    });
  }

  return doc.save();
};
