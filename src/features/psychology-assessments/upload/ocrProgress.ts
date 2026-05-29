/**
 * 활성 검사 배치(OCR_PHASE)의 진행 단계·진행률 파생 유틸.
 *
 * OCR은 서버(워커)가 처리하고 결과를 DB에 쓴다. 프론트는 배치를 폴링해 상태만 본다.
 * 따라서 모달을 닫거나 새로고침해도 진행 상황은 서버 배치 상태로 언제든 복원할 수 있다.
 * 모달(진행 중 표시)과 메인 뷰(상태 노출)가 같은 판정을 쓰도록 여기로 모은다.
 */
import type {
  AssessmentItem,
  AssessmentProgress,
} from './assessmentUploadGateway';

/**
 * - reviewing:    OCR 진행 중(하나라도 initiated/pending/processing)
 * - needs_review: 전부 종료됐고 확인 필요(실패 또는 valid 아님 → MISSING_FIELD/INVALID 등)
 * - ready:        전부 완료 + 전부 valid → 분석 시작 가능
 */
export type OcrStage = 'reviewing' | 'needs_review' | 'ready';

const STAGE_WEIGHT: Record<AssessmentProgress, number> = {
  initiated: 0.2,
  pending: 0.4,
  processing: 0.6,
  completed: 1,
  failed: 1,
};

const IN_FLIGHT: ReadonlySet<AssessmentProgress> = new Set([
  'initiated',
  'pending',
  'processing',
]);

export function deriveOcrStage(items: AssessmentItem[]): OcrStage {
  if (items.some((it) => IN_FLIGHT.has(it.progress))) return 'reviewing';
  const needsReview = items.some(
    (it) =>
      it.progress === 'failed' ||
      (it.validation != null && it.validation !== 'valid'),
  );
  return needsReview ? 'needs_review' : 'ready';
}

/** 건당 단계 가중치 평균 × 100. 항목 없으면 0. */
export function ocrReviewPercent(items: AssessmentItem[]): number {
  if (items.length === 0) return 0;
  const sum = items.reduce(
    (acc, it) => acc + (STAGE_WEIGHT[it.progress] ?? 0),
    0,
  );
  return Math.round((sum / items.length) * 100);
}
