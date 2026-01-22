/**
 * 축어록 편집 가이드 훅
 * - 진입점 모달 트리거 조건 체크
 * - Spotlight 연동 및 레벨별 타겟 요소 설정
 */

import { useCallback, useEffect, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { hasSeenGuide, useFeatureGuideStore } from '@/stores/featureGuideStore';
import { useQuestStore } from '@/stores/questStore';

import {
  TranscriptEditGuideTooltip,
  GUIDE_TOOLTIP_POSITIONS,
  GUIDE_TARGET_SELECTORS,
} from '../components/TranscriptEditGuideTooltip';

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

  // Quest Store (Spotlight 연동)
  const setSpotlightConfig = useQuestStore((state) => state.setSpotlightConfig);
  const clearSpotlight = useQuestStore((state) => state.clearSpotlight);

  // 모달이 한 번만 트리거되도록 ref로 추적
  const hasTriggeredRef = useRef(false);

  // 현재 가이드 레벨
  const currentLevel =
    activeGuide?.type === 'transcriptEdit' ? activeGuide.level : null;
  const isGuideActive = currentLevel !== null;

  /**
   * 진입점 모달 트리거 조건 체크
   */
  const checkEntryConditions = useCallback((): boolean => {
    // 이미 트리거된 경우
    if (hasTriggeredRef.current) return false;

    // 이미 본 가이드
    if (hasSeenGuide('transcriptEdit')) return false;

    // 더미 세션
    if (isDummySession) return false;

    // 축어록 탭이 아닌 경우
    if (activeTab !== 'transcript') return false;

    // 진입점 모달이 이미 열린 경우
    if (entryModal?.type === 'transcriptEdit') return false;

    // 가이드가 이미 활성화된 경우
    if (isGuideActive) return false;

    // 세션 수 체크 (< 5)
    if (userId) {
      const sessionsData = queryClient.getQueryData<{
        sessions: SessionWithRelations[];
      }>(['sessions', userId]);

      if (sessionsData) {
        // 세션 수 체크
        const sessionCount = sessionsData.sessions.length;

        if (sessionCount >= 5) return false;
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
   * - scrollTop > 10 조건으로 진입점 모달 트리거
   */
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      const scrollTop = e.currentTarget.scrollTop;

      if (scrollTop > 10 && checkEntryConditions()) {
        hasTriggeredRef.current = true;
        openEntryModal('transcriptEdit');
      }
    },
    [checkEntryConditions, openEntryModal]
  );

  /**
   * 레벨 변경 시 Spotlight 설정 업데이트
   */
  useEffect(() => {
    if (!isGuideActive || currentLevel === null) {
      clearSpotlight();
      return;
    }

    const selector = GUIDE_TARGET_SELECTORS[currentLevel];
    const targetElement = document.querySelector<HTMLElement>(selector);

    if (targetElement) {
      setSpotlightConfig({
        isActive: true,
        targetElement,
        tooltip: <TranscriptEditGuideTooltip level={currentLevel} />,
        tooltipPosition: GUIDE_TOOLTIP_POSITIONS[currentLevel],
        padding: 8,
        rounded: 'md',
      });
    }

    return () => {
      // cleanup은 다음 레벨에서 처리
    };
  }, [currentLevel, isGuideActive, setSpotlightConfig, clearSpotlight]);

  /**
   * 가이드 종료 시 Spotlight 정리
   */
  useEffect(() => {
    if (!isGuideActive) {
      clearSpotlight();
    }
  }, [isGuideActive, clearSpotlight]);

  /**
   * 탭 변경 시 트리거 상태 리셋
   */
  useEffect(() => {
    if (activeTab !== 'transcript') {
      hasTriggeredRef.current = false;
    }
  }, [activeTab]);

  // Feature Guide Store actions
  const nextLevel = useFeatureGuideStore((state) => state.nextLevel);

  /**
   * 실제 요소 클릭 시 다음 레벨로 전환
   * - 이벤트 위임(delegation)을 사용하여 동적으로 생성되는 요소도 처리
   * - Level 4는 TranscriptSegment에서 직접 처리 (stopPropagation 때문)
   */
  useEffect(() => {
    if (!isGuideActive || currentLevel === null) return;

    // Level 2는 텍스트 영역이라 직접 클릭 감지 불필요 (다음 버튼만)
    // Level 4는 TranscriptSegment에서 직접 처리 (stopPropagation 때문)
    // Level 5는 모달 내부라 직접 클릭 감지 불필요 (가이드 완료 버튼만)
    if (currentLevel === 2 || currentLevel === 4 || currentLevel === 5) return;

    const selector = GUIDE_TARGET_SELECTORS[currentLevel];
    if (!selector) return;

    // 이벤트 위임: document에서 클릭 이벤트 감지
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // 클릭된 요소 또는 상위 요소가 selector와 매칭되는지 확인
      if (target.closest(selector)) {
        nextLevel();
      }
    };

    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [currentLevel, isGuideActive, nextLevel]);

  return {
    handleScroll,
    currentLevel,
    isGuideActive,
  };
}

export default useTranscriptEditGuide;
