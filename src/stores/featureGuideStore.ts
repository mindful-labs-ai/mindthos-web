import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * 기능 가이드 타입 정의
 * - 새로운 가이드를 추가할 때 여기에 타입 추가
 */
export type FeatureGuideType = 'transcriptEdit';

/**
 * 각 가이드 타입별 최대 레벨
 */
const MAX_LEVELS: Record<FeatureGuideType, number> = {
  transcriptEdit: 5,
};

/**
 * localStorage 키 생성 헬퍼
 */
const getStorageKey = (type: FeatureGuideType) => `featureGuide_${type}_seen`;

/**
 * 가이드 확인 여부 체크 (localStorage)
 */
export const hasSeenGuide = (type: FeatureGuideType): boolean => {
  return localStorage.getItem(getStorageKey(type)) === 'true';
};

/**
 * 가이드 확인 처리 (localStorage)
 */
export const markGuideSeen = (type: FeatureGuideType): void => {
  localStorage.setItem(getStorageKey(type), 'true');
};

interface ActiveGuide {
  type: FeatureGuideType;
  level: number;
}

interface EntryModal {
  type: FeatureGuideType;
  isOpen: boolean;
}

interface SpotlightConfig {
  isActive: boolean;
  targetElement: HTMLElement | null;
  tooltip?: React.ReactNode;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  padding?: number;
  onClose?: () => void;
  rounded?: 'sm' | 'md' | 'lg' | 'full' | number;
}

interface FeatureGuideState {
  /** 현재 활성화된 가이드 (null이면 가이드 비활성) */
  activeGuide: ActiveGuide | null;
  /** 진입점 모달 상태 */
  entryModal: EntryModal | null;
  /** Spotlight 설정 */
  spotlightConfig: SpotlightConfig | null;
}

interface FeatureGuideActions {
  /**
   * 진입점 모달 열기
   */
  openEntryModal: (type: FeatureGuideType) => void;

  /**
   * 진입점 모달 닫기
   */
  closeEntryModal: () => void;

  /**
   * 가이드 시작 (Level 1부터)
   */
  startGuide: (type: FeatureGuideType) => void;

  /**
   * 다음 레벨로 진행
   */
  nextLevel: () => void;

  /**
   * 가이드 종료 및 seen 처리
   */
  endGuide: () => void;

  /**
   * 특정 가이드가 활성화되어 있는지 확인
   * @param type 가이드 타입
   * @param level 특정 레벨 (선택적)
   */
  isGuideActive: (type: FeatureGuideType, level?: number) => boolean;

  /**
   * 상태 초기화 (테스트/디버깅용)
   */
  reset: () => void;

  /**
   * Spotlight 설정
   */
  setSpotlightConfig: (config: SpotlightConfig | null) => void;

  /**
   * Spotlight 초기화
   */
  clearSpotlight: () => void;
}

export type FeatureGuideStore = FeatureGuideState & FeatureGuideActions;

export const useFeatureGuideStore = create<FeatureGuideStore>()(
  devtools(
    (set, get) => ({
      activeGuide: null,
      entryModal: null,
      spotlightConfig: null,

      openEntryModal: (type: FeatureGuideType) => {
        set(
          { entryModal: { type, isOpen: true } },
          false,
          'featureGuide/openEntryModal'
        );
      },

      closeEntryModal: () => {
        const { entryModal } = get();
        if (entryModal) {
          // 모달을 닫을 때 해당 가이드를 본 것으로 처리
          markGuideSeen(entryModal.type);
        }
        set({ entryModal: null }, false, 'featureGuide/closeEntryModal');
      },

      startGuide: (type: FeatureGuideType) => {
        set(
          {
            activeGuide: { type, level: 1 },
            entryModal: null, // 모달 닫기
          },
          false,
          'featureGuide/startGuide'
        );
      },

      nextLevel: () => {
        const { activeGuide } = get();
        if (!activeGuide) return;

        const maxLevel = MAX_LEVELS[activeGuide.type];
        const nextLevel = activeGuide.level + 1;

        if (nextLevel > maxLevel) {
          // 마지막 레벨이면 가이드 종료
          get().endGuide();
        } else {
          set(
            { activeGuide: { ...activeGuide, level: nextLevel } },
            false,
            'featureGuide/nextLevel'
          );
        }
      },

      endGuide: () => {
        const { activeGuide } = get();
        if (activeGuide) {
          markGuideSeen(activeGuide.type);
        }
        set(
          { activeGuide: null, spotlightConfig: null },
          false,
          'featureGuide/endGuide'
        );
      },

      isGuideActive: (type: FeatureGuideType, level?: number) => {
        const { activeGuide } = get();
        if (!activeGuide) return false;
        if (activeGuide.type !== type) return false;
        if (level !== undefined && activeGuide.level !== level) return false;
        return true;
      },

      reset: () => {
        set(
          { activeGuide: null, entryModal: null, spotlightConfig: null },
          false,
          'featureGuide/reset'
        );
      },

      setSpotlightConfig: (config) => {
        set({ spotlightConfig: config }, false, 'featureGuide/setSpotlightConfig');
      },

      clearSpotlight: () => {
        set({ spotlightConfig: null }, false, 'featureGuide/clearSpotlight');
      },
    }),
    { name: 'FeatureGuideStore' }
  )
);
