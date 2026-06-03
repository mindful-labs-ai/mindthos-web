import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';
import { SidePsychologyAssessmentIcon } from '@/shared/icons';

interface NoClientSelectedViewProps {
  className?: string;
}

export const NoClientSelectedView = ({
  className,
}: NoClientSelectedViewProps) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  // 모바일: 내담자 선택 트리거가 헤더 우측 상단에 있음
  const guideText = isMobileView
    ? '우측 상단에서 해석할 내담자를 선택하면\n심리검사 결과지를 등록하고 해석을 받을 수 있어요.'
    : '좌측에서 해석할 내담자를 선택하면\n심리검사 결과지를 등록하고 해석을 받을 수 있어요.';

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-5 px-10 text-center',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-grey-20 text-grey-60">
        <SidePsychologyAssessmentIcon size={32} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-l font-emphasize text-grey-100">
          내담자를 선택해 주세요
        </p>
        <p className="whitespace-pre-line text-sm text-grey-60">{guideText}</p>
      </div>
    </div>
  );
};
