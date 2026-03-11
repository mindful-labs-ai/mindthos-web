/**
 * PDF 보고서 POC 확인 페이지
 * 개발 환경에서 /report-poc 접근하여 PDF 렌더링 검증
 *
 * [페이지 번호]
 * @react-pdf/renderer의 render prop이 React 19에서 미동작하여
 * pdf-lib로 생성된 PDF를 후처리하여 각 페이지에 "1 / 7p" 형식의 번호를 삽입
 */
import { useEffect, useRef, useState } from 'react';

import { pdf } from '@react-pdf/renderer';

import { GenogramReportPDF } from '../components/GenogramReportPDF';
import { addPageNumbers } from '../utils/addPageNumbers';

import { longReport, shortReport } from './sampleData';

export const ReportPOCPage = () => {
  const [variant, setVariant] = useState<'short' | 'long'>('short');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const report = variant === 'short' ? shortReport : longReport;
  const prevUrlRef = useRef<string | null>(null);

  // PDF 생성 → pdf-lib 후처리 (페이지 번호 삽입) → blob URL
  useEffect(() => {
    let cancelled = false;

    const generate = async () => {
      setLoading(true);

      // 1. @react-pdf/renderer로 PDF 생성
      const blob = await pdf(<GenogramReportPDF report={report} />).toBlob();
      if (cancelled) return;

      // 2. pdf-lib로 페이지 번호 삽입
      const numberedBlob = await addPageNumbers(blob);
      if (cancelled) return;

      // 3. 이전 URL 해제 후 새 blob URL 생성
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      const url = URL.createObjectURL(numberedBlob);
      prevUrlRef.current = url;
      setPdfUrl(url);
      setLoading(false);
    };

    generate();

    return () => {
      cancelled = true;
    };
  }, [report]);

  // PDF 다운로드
  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `report-poc-${variant}.pdf`;
    a.click();
  };

  return (
    <div
      style={{
        padding: 24,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
          PDF Report POC
        </h2>
        <button
          onClick={() => setVariant('short')}
          style={{
            padding: '6px 16px',
            borderRadius: 6,
            border: '1px solid #ddd',
            background: variant === 'short' ? '#4F46E5' : '#fff',
            color: variant === 'short' ? '#fff' : '#333',
            cursor: 'pointer',
          }}
        >
          짧은 버전 (1~2p)
        </button>
        <button
          onClick={() => setVariant('long')}
          style={{
            padding: '6px 16px',
            borderRadius: 6,
            border: '1px solid #ddd',
            background: variant === 'long' ? '#4F46E5' : '#fff',
            color: variant === 'long' ? '#fff' : '#333',
            cursor: 'pointer',
          }}
        >
          긴 버전 (3~4p)
        </button>
        <button
          onClick={handleDownload}
          disabled={!pdfUrl}
          style={{
            padding: '6px 16px',
            borderRadius: 6,
            background: pdfUrl ? '#059669' : '#9CA3AF',
            color: '#fff',
            border: 'none',
            cursor: pdfUrl ? 'pointer' : 'not-allowed',
            fontSize: 14,
          }}
        >
          {loading ? '생성 중...' : 'PDF 다운로드'}
        </button>
      </div>

      {/* PDF 미리보기 (blob URL → iframe) */}
      {pdfUrl ? (
        <iframe
          src={pdfUrl}
          style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8 }}
          title="PDF Preview"
        />
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            color: '#9CA3AF',
          }}
        >
          PDF 생성 중...
        </div>
      )}
    </div>
  );
};
