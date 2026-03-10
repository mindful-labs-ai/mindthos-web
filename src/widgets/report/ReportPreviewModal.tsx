/**
 * PDF 보고서 미리보기 모달
 *
 * GenogramClientPage 위에 오버레이로 표시되며,
 * 가계도 분석 보고서 PDF를 미리보기 및 다운로드할 수 있다.
 *
 * [캡처 흐름]
 * 1. 모달 열림 → sampleData의 sections 중 graphData가 있는 genogram_image 탐색
 * 2. genogramRef를 통해 각 graphData를 로드 → 렌더 대기 → 캡처 → imageData로 변환
 * 3. 원본 가계도 복원 후 캡처된 imageData가 채워진 sections로 PDF 생성
 */
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { pdf } from '@react-pdf/renderer';
import { Download, Loader2, X } from 'lucide-react';

import { useGenogramCapture } from '@/features/report/hooks/useGenogramCapture';
import { shortReport } from '@/features/report/poc/sampleData';
import { addPageNumbers } from '@/features/report/utils/addPageNumbers';
import type { GenogramPageHandle } from '@/genogram';

import { GenogramReportPDF } from './GenogramReportPDF';

interface ReportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  genogramRef: RefObject<GenogramPageHandle | null>;
}

export function ReportPreviewModal({
  open,
  onOpenChange,
  genogramRef,
}: ReportPreviewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const prevUrlRef = useRef<string | null>(null);

  const { processReport, isCapturing } = useGenogramCapture(genogramRef);

  // PDF 생성 (캡처 → PDF 렌더링 → 페이지 번호 삽입)
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const generate = async () => {
      setLoading(true);

      // 1. graphData가 없는 genogram_image 섹션에만 현재 클라이언트 데이터 주입
      const liveGraphData = genogramRef.current?.toJSON() ?? undefined;
      const sectionsWithLiveGraph = shortReport.sections.map((section) =>
        section.type === 'genogram_image' && !section.graphData && liveGraphData
          ? { ...section, graphData: liveGraphData, imageData: undefined }
          : section
      );

      // 2. graphData → imageData 캡처
      const resolvedSections = await processReport(sectionsWithLiveGraph);
      if (cancelled) return;

      const resolvedReport = { ...shortReport, sections: resolvedSections };

      // 2. PDF 생성
      const blob = await pdf(
        <GenogramReportPDF report={resolvedReport} />
      ).toBlob();
      if (cancelled) return;

      // 3. 페이지 번호 삽입
      const numberedBlob = await addPageNumbers(blob);
      if (cancelled) return;

      // 4. blob URL 생성
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      const url = URL.createObjectURL(numberedBlob);
      prevUrlRef.current = url;
      setPdfUrl(url);
      setLoading(false);
    };

    generate();

    return () => {
      cancelled = true;
      // 닫히거나 재실행 시 이전 URL 해제
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
      }
    };
  }, [open, processReport, genogramRef]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // 스크롤 방지
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `가계도_분석_보고서.pdf`;
    a.click();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        role="presentation"
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onOpenChange(false);
        }}
      />

      {/* Modal */}
      <div className="relative z-10 flex h-[90vh] w-full max-w-[900px] flex-col rounded-2xl bg-white shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-fg">
            가계도 분석 보고서 미리보기
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!pdfUrl || loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              PDF 다운로드
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-contrast hover:text-fg"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF 미리보기 */}
        <div className="flex-1 overflow-hidden p-4">
          {loading || isCapturing || !pdfUrl ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-border bg-surface-contrast">
              <div className="flex items-center gap-3 text-fg-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>
                  {isCapturing ? '가계도 캡처 중...' : 'PDF 생성 중...'}
                </span>
              </div>
            </div>
          ) : (
            <iframe
              src={pdfUrl}
              className="h-full w-full rounded-lg border border-border"
              title="PDF Preview"
            />
          )}
        </div>
      </div>
    </div>
  );
}
