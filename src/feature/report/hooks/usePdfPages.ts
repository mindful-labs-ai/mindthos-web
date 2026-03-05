import { useEffect, useRef, useState } from 'react';

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const RENDER_SCALE = 1.5;

export function usePdfPages(pdfUrl: string | null) {
  const [pages, setPages] = useState<string[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const taskRef = useRef<pdfjsLib.PDFDocumentLoadingTask | null>(null);

  useEffect(() => {
    if (!pdfUrl) {
      setPages([]);
      return;
    }

    let cancelled = false;
    setIsRendering(true);

    const task = pdfjsLib.getDocument(pdfUrl);
    taskRef.current = task;

    (async () => {
      try {
        const pdfDoc = await task.promise;
        if (cancelled) return;

        const pageImages: string[] = [];

        for (let i = 1; i <= pdfDoc.numPages; i++) {
          if (cancelled) return;

          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: RENDER_SCALE });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.error('[usePdfPages] canvas 2d context null at page', i);
            continue;
          }

          await page.render({ canvas, canvasContext: ctx, viewport }).promise;

          pageImages.push(canvas.toDataURL('image/png'));
        }

        if (!cancelled) {
          setPages(pageImages);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[usePdfPages] error:', err);
        }
      } finally {
        if (!cancelled) {
          setIsRendering(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      task.destroy().catch(() => {});
      taskRef.current = null;
    };
  }, [pdfUrl]);

  return { pages, isRendering };
}
