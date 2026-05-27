import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { resetToOcrPhase } from '@/shared/api/server/assessmentUploadApi';

import type { AssessmentItem } from '../upload/assessmentUploadGateway';
import { serverAssessmentUploadAdapter } from '../upload/serverAssessmentUploadAdapter';

const gateway = serverAssessmentUploadAdapter;

export const assessmentBatchKeys = {
  batch: (clientId: string) => ['assessment-batch', clientId] as const,
};

/**
 * 내담자의 활성 검사 배치를 폴링한다.
 * PENDING/PROCESSING이 하나라도 있으면 주기 폴링, 전부 종료 상태면 폴링 중단.
 */
export function useAssessmentBatch(
  clientId: string | undefined,
  options: { enabled?: boolean; pollMs?: number } = {},
) {
  const { enabled = true, pollMs = 5000 } = options;
  return useQuery<AssessmentItem[]>({
    queryKey: assessmentBatchKeys.batch(clientId ?? ''),
    queryFn: () => gateway.listAssessments(clientId as string),
    enabled: enabled && !!clientId,
    refetchInterval: (query) => {
      const items = query.state.data;
      if (!items || items.length === 0) return false;
      const inFlight = items.some(
        (it) => it.progress === 'pending' || it.progress === 'processing',
      );
      return inFlight ? pollMs : false;
    },
  });
}

/** MISSING_FIELD 검사 확정 (빠진 필드 채운 최종 점수). */
export function useConfirmAssessment(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessmentId,
      score,
    }: {
      assessmentId: string;
      score: Record<string, unknown>;
    }) => gateway.confirmAssessment(assessmentId, score),
    onSuccess: () => {
      if (clientId)
        void qc.invalidateQueries({
          queryKey: assessmentBatchKeys.batch(clientId),
        });
    },
  });
}

/** 드래프트/INVALID 검사 삭제. */
export function useDeleteAssessment(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assessmentId: string) =>
      gateway.deleteAssessment(assessmentId),
    onSuccess: () => {
      if (clientId)
        void qc.invalidateQueries({
          queryKey: assessmentBatchKeys.batch(clientId),
        });
    },
  });
}

/**
 * OCR 단계 복귀(재검토) — CHAT_ACTIVE 내담자를 다시 OCR_PHASE로 되돌려 재업로드 가능하게.
 * 활성 버전 데이터는 보존(재확정 시 N→N+1). CHAT_ACTIVE가 아니면 서버 409.
 * 성공 시 활성 배치를 무효화해 빈 드래프트 상태를 다시 폴링하게 한다.
 */
export function useResetToOcrPhase(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!clientId) throw new Error('clientId가 없습니다.');
      return resetToOcrPhase(clientId);
    },
    onSuccess: () => {
      if (clientId)
        void qc.invalidateQueries({
          queryKey: assessmentBatchKeys.batch(clientId),
        });
    },
  });
}
