/**
 * 축어록 편집 가이드 훅
 * - 진입점 모달 트리거 조건 체크
 * - 가이드 레벨 상태 관리
 * - Spotlight은 SessionDetailPage에서 직접 래핑
 */

import { useCallback, useEffect, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { hasSeenGuide, useFeatureGuideStore } from '@/stores/featureGuideStore';

import type { SessionWithRelations } from './useSessionList';

interface UseTranscriptEditGuideOptions {
  /** 현재 활성 탭 */
  activeTab: string;
  /** 더미 세션 여부 */
  isDummySession: boolean;
  /** 현재 로그인한 사용자 ID */
  userId: number | undefined;
}

interface UseTranscriptEditGuideReturn {
  /** 스크롤 이벤트 핸들러 (축어록 컨테이너에 연결) */
  handleScroll: (e: React.UIEvent<HTMLElement>) => void;
  /** 현재 가이드 레벨 (null이면 비활성) */
  currentLevel: number | null;
  /** 가이드 활성 여부 */
  isGuideActive: boolean;
  /** 특정 레벨이 활성화되어 있는지 체크 */
  checkIsGuideLevel: (level: number) => boolean;
  /** 다음 레벨로 진행 */
  nextLevel: () => void;
  /** 가이드 종료 */
  endGuide: () => void;
  /** 스크롤을 최상단으로 이동 (Level 2 → 3 전환 시) */
  scrollToTop: () => void;
}

/**
 * 축어록 편집 기능 가이드 훅
 */
export function useTranscriptEditGuide({
  activeTab,
  isDummySession,
  userId,
}: UseTranscriptEditGuideOptions): UseTranscriptEditGuideReturn {
  const queryClient = useQueryClient();

  // Feature Guide Store
  const activeGuide = useFeatureGuideStore((state) => state.activeGuide);
  const openEntryModal = useFeatureGuideStore((state) => state.openEntryModal);
  const entryModal = useFeatureGuideStore((state) => state.entryModal);
  const nextLevel = useFeatureGuideStore((state) => state.nextLevel);
  const endGuide = useFeatureGuideStore((state) => state.endGuide);

  // 모달이 한 번만 트리거되도록 ref로 추적
  const hasTriggeredRef = useRef(false);

  // 스크롤 컨테이너 ref (Level 2 → 3 전환 시 스크롤 상단으로)
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  // 현재 가이드 레벨
  const currentLevel =
    activeGuide?.type === 'transcriptEdit' ? activeGuide.level : null;
  const isGuideActive = currentLevel !== null;

  /**
   * 특정 레벨이 활성화되어 있는지 체크
   */
  const checkIsGuideLevel = useCallback(
    (level: number): boolean => {
      return currentLevel === level;
    },
    [currentLevel]
  );

  /**
   * 스크롤을 최상단으로 이동
   */
  const scrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  /**
   * 진입점 모달 트리거 조건 체크
   */
  const checkEntryConditions = useCallback((): boolean => {
    if (hasTriggeredRef.current) return false;
    if (hasSeenGuide('transcriptEdit')) return false;
    if (isDummySession) return false;
    if (activeTab !== 'transcript') return false;
    if (entryModal?.type === 'transcriptEdit') return false;
    if (isGuideActive) return false;

    // 세션 수 체크 (< 5)
    if (userId) {
      const sessionsData = queryClient.getQueryData<{
        sessions: SessionWithRelations[];
      }>(['sessions', userId]);

      if (sessionsData && sessionsData.sessions.length >= 5) {
        return false;
      }
    }

    return true;
  }, [
    isDummySession,
    activeTab,
    entryModal,
    isGuideActive,
    userId,
    queryClient,
  ]);

  /**
   * 스크롤 이벤트 핸들러
   */
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      // 스크롤 컨테이너 ref 저장
      scrollContainerRef.current = e.currentTarget;

      const scrollTop = e.currentTarget.scrollTop;

      if (scrollTop > 10 && checkEntryConditions()) {
        hasTriggeredRef.current = true;
        openEntryModal('transcriptEdit');
      }
    },
    [checkEntryConditions, openEntryModal]
  );

  /**
   * 탭 변경 시 트리거 상태 리셋
   */
  useEffect(() => {
    if (activeTab !== 'transcript') {
      hasTriggeredRef.current = false;
    }
  }, [activeTab]);

  return {
    handleScroll,
    currentLevel,
    isGuideActive,
    checkIsGuideLevel,
    nextLevel,
    endGuide,
    scrollToTop,
  };
}

export default useTranscriptEditGuide;
