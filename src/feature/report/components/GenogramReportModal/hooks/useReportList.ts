import { useCallback, useState } from 'react';

import type { ReportListItem } from '../../../services/reportService';
import {
  createSignedPdfUrl,
  listReports,
  retryReport,
} from '../../../services/reportService';

type ToastFn = (opts: { title: string; description: string }) => void;

interface UseReportListOptions {
  clientId?: string;
  toast: ToastFn;
}

export interface UseReportListReturn {
  reports: ReportListItem[];
  isLoadingReports: boolean;
  retryingId: string | null;
  fetchReports: () => Promise<ReportListItem[]>;
  handleRetryReport: (reportId: string) => Promise<void>;
  handleDownloadReport: (report: ReportListItem) => Promise<void>;
  setReports: React.Dispatch<React.SetStateAction<ReportListItem[]>>;
}

export function useReportList({
  clientId,
  toast,
}: UseReportListOptions): UseReportListReturn {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchReports = useCallback(async (): Promise<ReportListItem[]> => {
    if (!clientId) return [];
    setIsLoadingReports(true);
    try {
      const data = await listReports(clientId);
      setReports(data);
      return data;
    } catch (e) {
      if (!import.meta.env.PROD)
        console.error(
          '보고서 목록 조회 실패:',
          e instanceof Error ? e.message : e
        );
      return [];
    } finally {
      setIsLoadingReports(false);
    }
  }, [clientId]);

  const handleRetryReport = useCallback(
    async (reportId: string) => {
      setRetryingId(reportId);
      try {
        await retryReport(reportId);
        toast({
          title: '보고서 재생성 완료',
          description: '보고서가 성공적으로 생성되었습니다.',
        });
        fetchReports();
      } catch (error) {
        toast({
          title: '재시도 실패',
          description:
            error instanceof Error ? error.message : '오류가 발생했습니다.',
        });
      } finally {
        setRetryingId(null);
      }
    },
    [toast, fetchReports]
  );

  const handleDownloadReport = useCallback(
    async (report: ReportListItem) => {
      if (!report.pdf_storage_key) return;
      try {
        const signedUrl = await createSignedPdfUrl(report.pdf_storage_key);
        const res = await fetch(signedUrl);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.title}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        toast({
          title: '다운로드 실패',
          description: 'PDF 다운로드 중 오류가 발생했습니다.',
        });
      }
    },
    [toast]
  );

  return {
    reports,
    isLoadingReports,
    retryingId,
    fetchReports,
    handleRetryReport,
    handleDownloadReport,
    setReports,
  };
}
