import { Loader2 } from 'lucide-react';

import { usePdfPages } from '@/features/report/hooks/usePdfPages';

interface PreviewStepProps {
  pdfUrl: string | null;
  isLoading: boolean;
  isCapturing: boolean;
  previewTitle: string;
  onTitleChange: (title: string) => void;
}

export function PreviewStep({
  pdfUrl,
  isLoading,
  isCapturing,
  previewTitle,
  onTitleChange,
}: PreviewStepProps) {
  const { pages, isRendering } = usePdfPages(pdfUrl);

  const showLoading = isLoading || isCapturing || !pdfUrl;

  return (
    <div className="flex flex-col gap-5">
      {/* 보고서 제목 */}
      <div>
        <p className="mb-2 text-sm font-medium text-fg">보고서 제목</p>
        <input
          type="text"
          value={previewTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface-contrast px-4 py-3 text-base text-fg outline-none transition-colors focus:border-primary"
        />
      </div>

      {/* PDF 미리보기 */}
      <div>
        <p className="mb-2 text-sm font-medium text-fg">PDF 미리보기</p>

        {showLoading || isRendering ? (
          <div className="flex h-[360px] items-center justify-center rounded-xl border border-border bg-surface-contrast">
            <div className="flex items-center gap-3 text-fg-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>
                {isCapturing
                  ? '가계도 캡처 중...'
                  : isRendering
                    ? '미리보기 렌더링 중...'
                    : 'PDF 생성 중...'}
              </span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border p-4">
            <div className="flex gap-4">
              {pages.map((src, i) => (
                <div key={i} className="shrink-0">
                  <div className="overflow-hidden rounded-lg border border-border">
                    <img
                      src={src}
                      alt={`${i + 1} 페이지`}
                      className="h-[300px] w-auto"
                    />
                  </div>
                  <p className="mt-2 text-center text-sm text-fg-muted">
                    {i + 1} 페이지
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
