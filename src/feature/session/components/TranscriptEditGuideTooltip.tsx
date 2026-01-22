import { Button } from '@/components/ui';
import { useFeatureGuideStore } from '@/stores/featureGuideStore';

/**
 * 레벨별 클릭 타겟 셀렉터
 */
export const GUIDE_TARGET_SELECTORS: Record<number, string> = {
  1: '[data-guide="transcript-edit-button"]',
  2: '[data-guide="transcript-segment-area"]',
  3: '[data-guide="transcript-save-button"]',
  4: '[data-guide="speaker-label"]',
  5: '[data-guide="speaker-change-modal"]',
};

/**
 * 레벨별 툴팁 위치 설정
 */
export const GUIDE_TOOLTIP_POSITIONS: Record<
  number,
  'top' | 'bottom' | 'left' | 'right'
> = {
  1: 'bottom', // 편집 버튼
  2: 'left', // 축어록 영역
  3: 'bottom', // 완료 버튼
  4: 'left', // 화자 라벨
  5: 'left', // 화자 선택 모달
};

/**
 * 버튼이 필요한 레벨 (실제 요소 클릭이 어려운 경우)
 * - Level 2: 텍스트 영역 전체라 직접 클릭 의미 없음
 * - Level 5: 모달 내부, 가이드 완료 처리 필요
 */
const LEVELS_WITH_BUTTON = [2, 5];

/**
 * 레벨별 버튼 텍스트
 */
const BUTTON_LABELS: Record<number, string> = {
  2: '다음',
  5: '가이드 완료',
};

/**
 * 레벨별 툴팁 내용
 */
const TOOLTIP_CONTENTS: Record<number, { title: string; description: string }> =
  {
    1: {
      title: '편집 버튼 클릭하기',
      description:
        '편집 버튼을 클릭하면 축어록을 수정할 수 있는 모드로 전환됩니다.',
    },
    2: {
      title: '수정할 텍스트 클릭하기',
      description:
        '수정하고 싶은 텍스트 영역을 클릭하면 직접 내용을 수정할 수 있습니다.',
    },
    3: {
      title: '완료 버튼 클릭하기',
      description:
        '수정이 완료되면 완료 버튼을 클릭하여 변경사항을 저장합니다.',
    },
    4: {
      title: '화자 라벨 클릭하기',
      description: '상담사/내담자 라벨을 클릭하면 화자를 변경할 수 있습니다.',
    },
    5: {
      title: '변경할 화자 선택하기',
      description:
        '변경하고 싶은 화자를 선택하면 해당 발화의 화자가 변경됩니다.',
    },
  };

interface TranscriptEditGuideTooltipProps {
  level: number;
}

/**
 * 축어록 편집 가이드 툴팁 컴포넌트
 * - Level 1, 3, 4: 안내 문구만 표시 (실제 요소 클릭으로 진행)
 * - Level 2, 5: 버튼 포함 (직접 클릭이 어렵거나 가이드 완료 처리 필요)
 */
export function TranscriptEditGuideTooltip({
  level,
}: TranscriptEditGuideTooltipProps) {
  const nextLevel = useFeatureGuideStore((state) => state.nextLevel);
  const endGuide = useFeatureGuideStore((state) => state.endGuide);

  const content = TOOLTIP_CONTENTS[level];
  if (!content) return null;

  const showButton = LEVELS_WITH_BUTTON.includes(level);
  const isLastLevel = level === 5;

  const handleButtonClick = () => {
    if (isLastLevel) {
      endGuide();
    } else {
      // Level 2에서 다음 버튼 클릭 시 스크롤을 최상단으로 이동 (화자 라벨이 보이도록)
      if (level === 2) {
        const scrollContainer = document.querySelector(
          GUIDE_TARGET_SELECTORS[2]
        );
        if (scrollContainer) {
          scrollContainer.scrollTop = 0;
        }
      }
      nextLevel();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-1 font-semibold text-fg">{content.title}</p>
        <p className="text-sm text-fg-muted">{content.description}</p>
      </div>

      {showButton && (
        <div className="flex gap-2">
          <Button
            onClick={handleButtonClick}
            tone="primary"
            size="sm"
            className="flex-1"
          >
            {BUTTON_LABELS[level]}
          </Button>
        </div>
      )}
    </div>
  );
}

export default TranscriptEditGuideTooltip;
