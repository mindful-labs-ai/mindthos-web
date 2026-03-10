import {
  AlertCircle,
  Download,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
} from 'lucide-react';

import type { ReportListItem } from '@/features/report/services/reportService';

import { formatDate } from '../constants';

interface ReportListStepProps {
  reports: ReportListItem[];
  isLoading: boolean;
  retryingId: string | null;
  onCreateReport: () => void;
  onDownloadReport: (report: ReportListItem) => void;
  onPreviewReport: (report: ReportListItem) => void;
  onRetryReport: (reportId: string) => void;
}

export function ReportListStep({
  reports,
  isLoading,
  retryingId,
  onCreateReport,
  onDownloadReport,
  onPreviewReport,
  onRetryReport,
}: ReportListStepProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex animate-pulse items-center justify-between rounded-xl border border-border px-5 py-4"
          >
            <div className="min-w-0 flex-1">
              <div className="h-4 w-40 rounded bg-surface-contrast" />
              <div className="mt-2 h-3 w-24 rounded bg-surface-contrast" />
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <div className="h-9 w-9 rounded-lg bg-surface-contrast" />
              <div className="h-9 w-9 rounded-lg bg-surface-contrast" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 빈 목록이면 useReportModal이 자동으로 verify 단계로 전환
  if (reports.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2.5">
      {reports.map((report) => (
        <div
          key={report.id}
          className="flex w-full items-center justify-between rounded-xl border border-border px-5 py-4"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-medium text-fg">
              {report.title}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm text-fg-muted">
                {formatDate(report.created_at)}
              </p>
              {report.status === 'IN_PROGRESS' && (
                <span className="flex items-center gap-1 text-xs text-fg-muted">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  생성 중
                </span>
              )}
              {report.status === 'FAILED' && (
                <span className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  실패
                </span>
              )}
            </div>
          </div>

          {report.status === 'SUCCEEDED' && (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onPreviewReport(report)}
                title="미리보기"
                className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-contrast hover:text-fg"
              >
                <Eye className="h-5 w-5" />
              </button>
              {report.pdf_storage_key && (
                <button
                  type="button"
                  onClick={() => onDownloadReport(report)}
                  title="다운로드"
                  className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-contrast hover:text-fg"
                >
                  <Download className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {report.status === 'FAILED' && (
            <button
              type="button"
              onClick={() => onRetryReport(report.id)}
              disabled={retryingId === report.id}
              className="shrink-0 rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              {retryingId === report.id ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      ))}

      <div className="h-2.5" />

      <CreateReportButton onClick={onCreateReport} />
    </div>
  );
}

function CreateReportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full max-w-[265px] items-center justify-center gap-2 rounded-lg border-2 border-primary-400 bg-primary-50 py-2.5 text-base font-medium text-primary-400 transition-colors hover:border-primary hover:bg-primary-100"
    >
      <Plus className="h-5 w-5" />
      새로운 보고서 만들기
    </button>
  );
}
