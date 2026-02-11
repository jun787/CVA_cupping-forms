import { useEffect, useRef } from 'react';
import { getDocument } from '../lib/pdfjs';

type Props = {
  pageNumber: number;
  pdfPath: string;
  onViewport?: (size: { width: number; height: number }) => void;
  onError?: (message: string) => void;
};

export function PdfCanvasPage({ pageNumber, pdfPath, onViewport, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const pdf = await getDocument(pdfPath).promise;
        const page = await pdf.getPage(pageNumber);
        const base = page.getViewport({ scale: 1 });
        const maxWidth = Math.min(window.innerWidth - 24, base.width);
        const scale = maxWidth / base.width;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas || !mounted) return;
        const ratio = window.devicePixelRatio || 1;
        canvas.width = viewport.width * ratio;
        canvas.height = viewport.height * ratio;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        await page.render({ canvasContext: ctx, viewport }).promise;
        onViewport?.({ width: viewport.width, height: viewport.height });
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'PDF 渲染失敗');
      }
    })();
    return () => {
      mounted = false;
    };
  }, [pageNumber, pdfPath, onViewport, onError]);

  return <canvas ref={canvasRef} />;
}
