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
      마음토스가 제공하는 해석은 참고용입니다. 최종 해석은 자격을 갖춘 임상가가
      수행해야 합니다.
    </p>
  );
};
