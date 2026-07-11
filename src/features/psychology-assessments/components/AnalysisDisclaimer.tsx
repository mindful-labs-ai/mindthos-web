import { cn } from '@/lib/cn';
import { useDevice } from '@/shared/hooks/useDevice';

interface AnalysisDisclaimerProps {
  className?: string;
}

export const AnalysisDisclaimer = ({ className }: AnalysisDisclaimerProps) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  return (
    <p
      className={cn(
        'text-center font-medium text-grey-70',
        isMobileView ? 'text-xs' : 'text-sm',
        className
      )}
    >
      마음토스의 해석은 참고 자료로 활용해 주세요. 최종 판단은 자격을 갖춘
      임상가의 검토가 필요해요.
    </p>
  );
};
