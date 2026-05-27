import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getAnalysisStatus,
  startAnalysis,
  type AnalysisStatusResponse,
} from '@/shared/api/server/assessmentUploadApi';

import { assessmentBatchKeys } from './useAssessmentBatch';

export const analysisKeys = {
  status: (clientId: string) => ['analysis-status', clientId] as const,
};

/**
 * 분석 완료 판정.
 * integrationReportCompleted === true 이거나 chatActiveStatus === "CHAT_ACTIVE" 이면 완료.
 */
export function isAnalysisComplete(status: AnalysisStatusResponse): boolean {
  return (
    status.integrationReportCompleted || status.chatActiveStatus === 'CHAT_ACTIVE'
  );
}

/**
 * 분석 진행률 계산 (0~100).
 * 개별 보고서 완료 수 + 통합 보고서(integrationReportCompleted)를 합산.
 * 임상(clinical) 단계는 없음.
 */
export function calcAnalysisPercent(status: AnalysisStatusResponse): number {
  const total = status.assessmentReports.length + 1; // +1 = 통합 보고서
  if (total === 0) return 0;
  const done =
    status.assessmentReports.filter((r) => r.completed).length +
    (status.integrationReportCompleted ? 1 : 0);
  return Math.round((done / total) * 100);
}

/**
 * 분석 시작 mutation.
 * 성공 시 assessment-batch 쿼리를 무효화하고 analysis-status 폴링을 활성화할 수 있도록
 * analysis-status 쿼리 키도 무효화한다.
 */
export function useStartAnalysis(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!clientId) throw new Error('clientId가 없습니다.');
      return startAnalysis(clientId);
    },
    onSuccess: () => {
      if (!clientId) return;
      void qc.invalidateQueries({
        queryKey: assessmentBatchKeys.batch(clientId),
      });
      void qc.invalidateQueries({
        queryKey: analysisKeys.status(clientId),
      });
    },
  });
}

/**
 * 분석 진행 상태 조회/폴링. 내담자 phase(chatActiveStatus)의 단일 권위 소스.
 * - enabled: clientId 있으면 항상(진입 시 phase 파악 → 모드 결정).
 * - refetchInterval: ANALYSIS_PHASE에서 완료 전까지만 폴링. OCR_PHASE(분석 전)·
 *   CHAT_ACTIVE(완료)는 정적이므로 폴링하지 않는다.
 */
export function useAnalysisStatus(
  clientId: string | undefined,
  options: { enabled?: boolean; pollMs?: number } = {},
) {
  const { enabled = true, pollMs = 4000 } = options;
  return useQuery<AnalysisStatusResponse>({
    queryKey: analysisKeys.status(clientId ?? ''),
    queryFn: () => getAnalysisStatus(clientId as string),
    enabled: enabled && !!clientId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return pollMs;
      if (data.chatActiveStatus !== 'ANALYSIS_PHASE') return false;
      return isAnalysisComplete(data) ? false : pollMs;
    },
  });
}
