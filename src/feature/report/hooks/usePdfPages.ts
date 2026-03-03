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

    //TODO : 배포시 삭제 pdf 이미지 미리보기 관련 로그
    console.log(
      '[usePdfPages] pdfUrl type:',
      typeof pdfUrl,
      'length:',
      pdfUrl.length
    );
    console.log('[usePdfPages] pdfUrl prefix:', pdfUrl.slice(0, 50));
    console.log(
      '[usePdfPages] workerSrc:',
      pdfjsLib.GlobalWorkerOptions.workerSrc
    );

    const task = pdfjsLib.getDocument(pdfUrl);
    taskRef.current = task;

    (async () => {
      try {
        const pdfDoc = await task.promise;
        console.log('[usePdfPages] loaded, numPages:', pdfDoc.numPages);
        if (cancelled) { console.log('[usePdfPages] cancelled after load'); return; }

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
          console.log('[usePdfPages] rendered page', i, `(${canvas.width}x${canvas.height})`);

          pageImages.push(canvas.toDataURL('image/png'));
        }

        if (!cancelled) {
          console.log('[usePdfPages] done, total pages:', pageImages.length);
          setPages(pageImages);
        } else {
          console.log('[usePdfPages] cancelled during render');
        }
      } catch (err) {
        console.error('[usePdfPages] error:', err);
      } finally {
        if (!cancelled) {
          setIsRendering(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      task.destroy();
      taskRef.current = null;
    };
  }, [pdfUrl]);

  return { pages, isRendering };
}
