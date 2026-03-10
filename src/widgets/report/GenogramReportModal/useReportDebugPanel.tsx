import type { ReactNode } from 'react';

import type { ReportListItem } from '@/shared/api/supabase/reportQueries';
import {
  DebugChip,
  DebugSection,
  useDebugPanel,
} from '@/shared/hooks/useDebugPanel';

import type { GeneratingStatus } from '../ReportGeneratingView';

import type { ModalStep } from './types';

interface DebugPanelState {
  step: ModalStep;
  setStep: (step: ModalStep) => void;
  hasAccess: boolean | null;
  setHasAccess: (v: boolean | null) => void;
  generatingStatus: GeneratingStatus;
  setGeneratingStatus: (v: GeneratingStatus) => void;
  generatingError: string | null;
  setGeneratingError: (v: string | null) => void;
  isLoadingReports: boolean;
  setIsLoadingReports: (v: boolean) => void;
  isLoadingPreview: boolean;
  setIsLoadingPreview: (v: boolean) => void;
  reports: ReportListItem[];
  setReports: React.Dispatch<React.SetStateAction<ReportListItem[]>>;
}

export function useReportDebugPanel({
  step,
  setStep,
  hasAccess,
  setHasAccess,
  generatingStatus,
  setGeneratingStatus,
  generatingError,
  setGeneratingError,
  isLoadingReports,
  setIsLoadingReports,
  isLoadingPreview,
  setIsLoadingPreview,
  reports,
  setReports,
}: DebugPanelState): ReactNode {
  return useDebugPanel(
    'Report Modal',
    {
      step: {
        value: step,
        set: setStep,
        options: ['list', 'verify', 'input', 'generating', 'preview'] as const,
      },
      hasAccess: {
        value: hasAccess,
        set: setHasAccess,
        options: [true, false, null] as const,
      },
      generatingStatus: {
        value: generatingStatus,
        set: setGeneratingStatus,
        options: ['processing', 'success', 'error'] as const,
      },
      generatingError: {
        value: generatingError,
        set: setGeneratingError,
        options: ['디버그 에러', null] as const,
      },
      isLoadingReports: {
        value: isLoadingReports,
        set: setIsLoadingReports,
      },
      isLoadingPreview: {
        value: isLoadingPreview,
        set: setIsLoadingPreview,
      },
    },
    reports.length > 0 && (
      <DebugSection label="reports">
        <div className="flex max-h-32 flex-col gap-1 overflow-y-auto">
          {reports.map((r) => (
            <div key={r.id} className="flex items-center gap-1">
              <span className="w-20 truncate" title={r.title}>
                {r.title}
              </span>
              {(['SUCCEEDED', 'FAILED', 'IN_PROGRESS'] as const).map((s) => (
                <DebugChip
                  key={s}
                  label={s.slice(0, 4)}
                  active={r.status === s}
                  onClick={() =>
                    setReports((prev) =>
                      prev.map((x) =>
                        x.id === r.id
                          ? {
                              ...x,
                              status: s,
                              pdf_storage_key:
                                s === 'FAILED' ? null : x.pdf_storage_key,
                            }
                          : x
                      )
                    )
                  }
                />
              ))}
              <DebugChip
                label={r.pdf_storage_key ? 'PDF' : 'noPDF'}
                active={!!r.pdf_storage_key}
                onClick={() =>
                  setReports((prev) =>
                    prev.map((x) =>
                      x.id === r.id
                        ? {
                            ...x,
                            pdf_storage_key: x.pdf_storage_key
                              ? null
                              : 'debug/mock/report.pdf',
                          }
                        : x
                    )
                  )
                }
              />
            </div>
          ))}
        </div>
      </DebugSection>
    )
  );
}
