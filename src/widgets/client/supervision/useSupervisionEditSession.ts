import { useCallback, useState } from 'react';

import type { SupervisionReportV2 } from '@/features/client/types/supervisionReport.types';
import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';

interface UseSupervisionEditSessionOptions {
  /** 저장 콜백 — draft를 JSON 문자열로 직렬화해 전달 */
  onSave: (content: string) => Promise<void>;
  /** Mixpanel 트래킹 메타데이터 */
  trackingMeta?: Record<string, unknown>;
}

interface UseSupervisionEditSessionReturn {
  isEditing: boolean;
  /** 편집 중 draft (편집 아닐 땐 null) */
  draft: SupervisionReportV2 | null;
  hasEdits: boolean;
  isSaving: boolean;
  handleEditStart: (original: SupervisionReportV2) => void;
  handleCancelEdit: () => void;
  handleSaveEdit: () => Promise<void>;
  updateDraft: (next: SupervisionReportV2) => void;
}

/**
 * 고정 구조(V2) JSON 보고서의 필드 단위 편집 세션.
 * 섹션 제목·순서·표 헤더는 프론트 config 소유라 편집 대상이 아니므로
 * 텍스트만 수정 가능 — 스키마가 깨질 수 없다.
 * 저장은 draft를 JSON.stringify해 기존 content 저장 경로를 그대로 사용.
 */
export function useSupervisionEditSession({
  onSave,
  trackingMeta,
}: UseSupervisionEditSessionOptions): UseSupervisionEditSessionReturn {
  const [draft, setDraft] = useState<SupervisionReportV2 | null>(null);
  const [hasEdits, setHasEdits] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleEditStart = useCallback(
    (original: SupervisionReportV2) => {
      // 깊은 복사로 스냅샷 — 원본 객체를 직접 변형하지 않는다
      setDraft(JSON.parse(JSON.stringify(original)) as SupervisionReportV2);
      setHasEdits(false);
      trackEvent(MixpanelEvent.AnalysisEditStart, {
        ...trackingMeta,
        format: 'structured',
      });
    },
    [trackingMeta]
  );

  const handleCancelEdit = useCallback(() => {
    setDraft(null);
    setHasEdits(false);
    trackEvent(MixpanelEvent.AnalysisEditCancel, {
      ...trackingMeta,
      format: 'structured',
    });
  }, [trackingMeta]);

  const updateDraft = useCallback((next: SupervisionReportV2) => {
    setDraft(next);
    setHasEdits(true);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!draft || !hasEdits || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(JSON.stringify(draft));
      trackEvent(MixpanelEvent.AnalysisEditComplete, {
        ...trackingMeta,
        format: 'structured',
      });
      setDraft(null);
      setHasEdits(false);
    } finally {
      setIsSaving(false);
    }
  }, [draft, hasEdits, isSaving, onSave, trackingMeta]);

  return {
    isEditing: draft !== null,
    draft,
    hasEdits,
    isSaving,
    handleEditStart,
    handleCancelEdit,
    handleSaveEdit,
    updateDraft,
  };
}
