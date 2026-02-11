import { useEffect, useRef } from 'react';
import { getDocument } from '../lib/pdfjs';

type Props = {
  pageNumber: number;
  pdfPath: string;
  onViewport?: (size: { width: number; height: number }) => void;
  onError?: (message: string) => void;
};

const MAX_DPR = 3;
const MAX_CANVAS_PIXELS = 16_000_000;

export function PdfCanvasPage({ pageNumber, pdfPath, onViewport, onError }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const renderTokenRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    let cleanupListeners: (() => void) | null = null;

    const cancelCurrentRender = () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore cancel errors
        }
        renderTaskRef.current = null;
      }
    };

    const scheduleRender = (run: () => void) => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        run();
      });
    };

    (async () => {
      try {
        const pdf = await getDocument(pdfPath).promise;
        const page = await pdf.getPage(pageNumber);

        const render = () => {
          scheduleRender(async () => {
            const canvas = canvasRef.current;
            if (!canvas || !mounted) return;

            const token = ++renderTokenRef.current;
            cancelCurrentRender();

            const base = page.getViewport({ scale: 1 });
            const container = canvas.parentElement;
            const containerWidth = container?.clientWidth || Math.min(window.innerWidth - 24, base.width);
            const cssScale = containerWidth / base.width;
            const cssW = base.width * cssScale;
            const cssH = base.height * cssScale;

            let dpr = Math.max(1, Math.min(MAX_DPR, window.devicePixelRatio || 1));
            const pixelsAtDpr = cssW * cssH * dpr * dpr;
            if (pixelsAtDpr > MAX_CANVAS_PIXELS) {
              dpr = Math.max(1, Math.min(dpr, Math.sqrt(MAX_CANVAS_PIXELS / (cssW * cssH))));
            }

            const renderViewport = page.getViewport({ scale: cssScale * dpr });
            canvas.width = Math.floor(renderViewport.width);
            canvas.height = Math.floor(renderViewport.height);
            canvas.style.width = `${cssW}px`;
            canvas.style.height = `${cssH}px`;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const renderTask = page.render({ canvasContext: ctx, viewport: renderViewport });
            renderTaskRef.current = renderTask;

            try {
              await renderTask.promise;
              if (!mounted || token !== renderTokenRef.current) return;
              onViewport?.({ width: cssW, height: cssH });
            } catch (error) {
              if (!mounted || token !== renderTokenRef.current) return;
              const message = error instanceof Error ? error.message : 'PDF 渲染失敗';
              if (!/cancel/i.test(message)) {
                onError?.(message);
              }
            }
          });
        };

        render();

        const resizeHandler = () => render();
        window.addEventListener('resize', resizeHandler);
        const vv = window.visualViewport;
        vv?.addEventListener('resize', resizeHandler);

        const container = canvasRef.current?.parentElement;
        const observer = new ResizeObserver(() => {
          render();
        });
        if (container) observer.observe(container);

        cleanupListeners = () => {
          window.removeEventListener('resize', resizeHandler);
          vv?.removeEventListener('resize', resizeHandler);
          observer.disconnect();
        };
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'PDF 渲染失敗');
      }
    })();

    return () => {
      mounted = false;
      renderTokenRef.current += 1;
      cleanupListeners?.();
      cancelCurrentRender();
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [pageNumber, pdfPath, onViewport, onError]);

  return <canvas ref={canvasRef} />;
}
