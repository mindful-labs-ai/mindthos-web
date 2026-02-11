import { useEffect, useRef, useState } from 'react';

import { Check } from 'lucide-react';

import { Alert } from '@/components/ui/atoms/Alert';
import { Button } from '@/components/ui/atoms/Button';

import { GenogramLoadingAnimationLoop } from '../GenogramLoadingAnimation';

// 애니메이션 1회 사이클 시간 (4초 - GenogramLoadingAnimationLoop 기준)
const ANIMATION_CYCLE_DURATION = 4000;
// 최소 애니메이션 반복 횟수
const MIN_ANIMATION_CYCLES = 3;

interface RenderStepProps {
  error: string | null;
  isPending: boolean;
  onComplete: () => void;
  onCancel?: () => void;
}

export function RenderStep({
  error,
  isPending,
  onComplete,
  onCancel,
}: RenderStepProps) {
  // 최소 애니메이션 사이클 완료 여부
  const [animationComplete, setAnimationComplete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 컴포넌트 마운트 시 애니메이션 타이머 시작
  useEffect(() => {
    const totalDuration = ANIMATION_CYCLE_DURATION * MIN_ANIMATION_CYCLES;
    timerRef.current = setTimeout(() => {
      setAnimationComplete(true);
    }, totalDuration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // props에서 직접 상태 계산
  const status = error ? 'error' : isPending ? 'processing' : 'success';

  // 애니메이션 완료 전이거나 아직 처리 중이면 로딩 표시
  const showLoading =
    status === 'processing' || (status === 'success' && !animationComplete);
  // 버튼 활성화: 성공 상태이면서 애니메이션 완료
  const showSuccessUI = status === 'success' && animationComplete;

  return (
    <div className="space-y-6 py-8">
      {showLoading && (
        <div className="flex flex-col items-center justify-center">
          <GenogramLoadingAnimationLoop />
        </div>
      )}

      {showSuccessUI && (
        <div className="flex flex-col items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-fg">
            가계도가 생성되었습니다!
          </h3>
          <p className="mt-2 text-sm text-fg-muted">
            캔버스에서 가계도를 확인하고 편집할 수 있습니다.
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-4">
          <Alert tone="danger">
            {error || '렌더링 중 오류가 발생했습니다.'}
          </Alert>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              돌아가기
            </Button>
          )}
        </div>
      )}

      {/* 완료 버튼 */}
      {showSuccessUI && (
        <div className="flex justify-center">
          <Button onClick={onComplete} tone="primary">
            가계도 확인하기
          </Button>
        </div>
      )}
    </div>
  );
}
