import { useCallback, useState } from 'react';

import { trackEvent } from '@/lib/mixpanel';
import type { ReportListItem } from '@/shared/api/supabase/reportQueries';
import {
  createSignedPdfUrl,
  listReports,
  pollReportUntilTerminal,
  ReportPollCancelledError,
  ReportPollTimeoutError,
  retryReport,
} from '@/shared/api/supabase/reportQueries';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';

type ToastFn = (opts: { title: string; description: string }) => void;

interface UseReportListOptions {
  clientId?: string;
  toast: ToastFn;
  /**
   * 모달을 열거나 닫을 때마다 증가하는 단조 실행 토큰(부모와 공유).
   * 재시도 플로우는 시작 시 값을 캡처하고, 현재 값과 달라지면 취소로 간주한다 —
   * 닫힘 직후 재오픈이 이전(stale) 폴링을 되살리지 못하게 한다.
   */
  runIdRef?: React.MutableRefObject<number>;
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
  runIdRef,
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
      if (!clientId) return;
      // 실행 토큰을 캡처 — 이후 재오픈으로 값이 바뀌면 취소로 간주한다.
      const myRun = runIdRef?.current;
      const cancelled = () => runIdRef != null && runIdRef.current !== myRun;
      setRetryingId(reportId);
      try {
        const dispatched = await retryReport(reportId);
        // 이미 완료된 보고서 재시도는 즉시 성공으로 반환된다.
        if (dispatched.status === 'SUCCEEDED') {
          toast({
            title: '보고서 재생성 완료',
            description: '보고서를 만들었어요.',
          });
          await fetchReports();
          return;
        }

        // IN_PROGRESS: 목록을 갱신해 "생성 중"을 노출하고 terminal까지 폴링한다.
        await fetchReports();
        setRetryingId(null);
        const finalReport = await pollReportUntilTerminal(clientId, reportId, {
          shouldCancel: cancelled,
        });
        // 폴링이 끝난 뒤 모달이 닫혔다면(재오픈 포함) 닫힌 모달에 토스트/갱신하지 않는다.
        if (cancelled()) return;
        await fetchReports();
        toast(
          finalReport.status === 'SUCCEEDED'
            ? {
                title: '보고서 재생성 완료',
                description: '보고서를 만들었어요.',
              }
            : {
                title: '재시도 실패',
                description: '보고서를 생성하지 못했어요.',
              }
        );
      } catch (error) {
        if (error instanceof ReportPollCancelledError) return;
        if (error instanceof ReportPollTimeoutError) {
          toast({
            title: '보고서 생성 중',
            description:
              '보고서 생성이 조금 더 걸리고 있어요. 잠시 후 목록에서 확인해주세요.',
          });
          return;
        }
        toast({
          title: '재시도 실패',
          description:
            error instanceof Error ? error.message : '오류가 생겼어요.',
        });
      } finally {
        setRetryingId(null);
      }
    },
    [clientId, toast, fetchReports, runIdRef]
  );

  const handleDownloadReport = useCallback(
    async (report: ReportListItem) => {
      if (!report.pdf_storage_key) return;
      trackEvent(MixpanelEvent.GenogramReportDownloadClick, {
        client_id: clientId,
        report_id: report.id,
      });
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
          description: 'PDF 다운로드 중 오류가 생겼어요.',
        });
      }
    },
    [clientId, toast]
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
