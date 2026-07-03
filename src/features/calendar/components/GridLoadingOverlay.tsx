import { cn } from '@/lib/cn';
import { Spinner } from '@/shared/ui';

interface GridLoadingOverlayProps {
  /** 데스크톱 그리드는 둥근 모서리(rounded-2xl)라 오버레이도 라운드 처리. */
  rounded?: boolean;
}

/** 최초 일정 로드 중 그리드 영역 위에 띄우는 반투명 스피너 오버레이(백그라운드 refetch는 제외). */
export function GridLoadingOverlay({
  rounded = false,
}: GridLoadingOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center bg-white/60',
        rounded && 'rounded-2xl'
      )}
    >
      <Spinner size="lg" ariaLabel="일정을 불러오는 중" />
    </div>
  );
}
