/**
 * 축어록 편집 가이드 툴팁 컴포넌트들
 * - TutorialTooltips.tsx 패턴을 따름
 * - 각 레벨별 툴팁을 개별 컴포넌트로 export
 */

interface TooltipContainerProps {
  title: string;
  description: string | React.ReactNode;
  step?: number;
  totalSteps?: number;
  buttonText?: string;
  onButtonClick?: () => void;
}

const TooltipContainer = ({
  title,
  description,
  buttonText,
  onButtonClick,
}: TooltipContainerProps) => (
  <div className="flex w-full max-w-[220px] flex-col justify-center gap-2">
    <p className="text-xs font-semibold text-primary">축어록 편집 가이드</p>
    <h4 className="mb-2 text-base font-bold text-fg">{title}</h4>
    <div className="mb-4 break-keep text-sm">{description}</div>

    {buttonText && onButtonClick && (
      <button
        onClick={onButtonClick}
        className="mt-2 w-full rounded-md bg-primary-50 py-2 font-medium text-primary"
      >
        {buttonText}
      </button>
    )}
  </div>
);

interface GuideTooltipProps {
  onNext?: () => void;
  onComplete?: () => void;
}

/**
 * Level 1: 편집 버튼 클릭 안내
 */
export const EditButtonTooltip = () => (
  <TooltipContainer
    title="편집 버튼 클릭하기"
    description="축어록에 수정이 필요하다면, <편집> 버튼을 눌러서 편집 모드로 변환해보세요."
    step={1}
  />
);

/**
 * Level 2: 텍스트 수정 안내
 */
export const TextEditTooltip = ({ onNext }: GuideTooltipProps) => (
  <TooltipContainer
    title="수정할 텍스트 클릭하기"
    description="편집모드에서는 자유롭게 텍스트를 수정할 수 있어요. 아무 텍스트나 클릭해서 한 번 수정해보세요!"
    step={2}
    buttonText="다음"
    onButtonClick={onNext}
  />
);

/**
 * Level 3: 완료 버튼 클릭 안내
 */
export const SaveButtonTooltip = () => (
  <TooltipContainer
    title="완료 버튼 클릭하기"
    description="축어록 편집이 모두 끝났다면, <완료> 버튼을 눌러서 편집 모드를 종료하세요. 수정된 축어록은 자동으로 저장됩니다."
    step={3}
  />
);

/**
 * Level 4: 화자 라벨 클릭 안내
 */
export const SpeakerLabelTooltip = () => (
  <TooltipContainer
    title="상담자/내담자 클릭하기"
    description="화자를 바꾸거나 직접 이름을 등록하고 싶다면, 변경할 상담자/내담자를 클릭해보세요."
    step={4}
  />
);

/**
 * Level 5: 화자 선택 모달 안내
 */
export const SpeakerSelectTooltip = ({ onComplete }: GuideTooltipProps) => (
  <TooltipContainer
    title="변경할 화자 선택하기"
    description="변경할 화자를 선택한 다음, 변경사항을 적용할 구간을 고르면 수정을 완료할 수 있어요. 이제 축어록을 마음껏 수정해보세요!"
    step={5}
    buttonText="가이드 완료"
    onButtonClick={onComplete}
  />
);
