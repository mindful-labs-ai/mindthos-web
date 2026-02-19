import { useEffect, useRef, useState } from 'react';

import { Check } from 'lucide-react';

import { Alert } from '@/components/ui/atoms/Alert';
import { Button } from '@/components/ui/atoms/Button';
import { trackEvent } from '@/lib/mixpanel';

import {
  GenogramLoadingAnimation,
  GenogramLoadingAnimationLoop,
} from '../GenogramLoadingAnimation';

// 애니메이션 1회 사이클 시간 (4초 - GenogramLoadingAnimationLoop 기준)
const ANIMATION_CYCLE_DURATION = 3200;
// 최소 애니메이션 반복 횟수
const MIN_ANIMATION_CYCLES = 3;

interface RenderStepProps {
  error: string | null;
  isPending: boolean;
  onComplete: () => void;
  onCancel?: () => void;
  /** 편집 모드일 때 애니메이션 대기 건너뛰기 */
  isEditMode?: boolean;
}

export function RenderStep({
  error,
  isPending,
  onComplete,
  onCancel,
  isEditMode = false,
}: RenderStepProps) {
  // 최소 애니메이션 사이클 완료 여부 (edit 모드면 바로 완료)
  const [animationComplete, setAnimationComplete] = useState(isEditMode);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 컴포넌트 마운트 시 애니메이션 타이머 시작 (edit 모드가 아닐 때만)
  useEffect(() => {
    if (isEditMode) return;

    const totalDuration = ANIMATION_CYCLE_DURATION * MIN_ANIMATION_CYCLES;
    timerRef.current = setTimeout(() => {
      setAnimationComplete(true);
    }, totalDuration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isEditMode]);

  // edit 모드에서 성공 시 바로 완료 처리 (성공 UI 스킵)
  useEffect(() => {
    if (isEditMode && !isPending && !error) {
      timerRef.current = setTimeout(() => {
        onComplete();
      }, 1500);
    }
  }, [isEditMode, isPending, error, onComplete]);

  // props에서 직접 상태 계산
  const status = error ? 'error' : isPending ? 'processing' : 'success';

  // 애니메이션 완료 전이거나 아직 처리 중이면 로딩 표시
  // edit 모드에서는 성공 상태에서도 스피너 표시 (자동 완료 처리됨)
  const showLoading =
    status === 'processing' ||
    (status === 'success' && !animationComplete) ||
    (status === 'success' && isEditMode);
  // 버튼 활성화: 성공 상태이면서 애니메이션 완료 (edit 모드에서는 표시 안 함)
  const showSuccessUI =
    status === 'success' && animationComplete && !isEditMode;

  return (
    <div className="space-y-6 py-8">
      {showLoading && (
        <div className="flex flex-col items-center justify-center">
          {isEditMode ? (
            <GenogramLoadingAnimation />
          ) : (
            <GenogramLoadingAnimationLoop />
          )}
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
          <Button
            onClick={() => {
              trackEvent('genogram_creation_complete_click');
              onComplete();
            }}
            tone="primary"
          >
            가계도 확인하기
          </Button>
        </div>
      )}
    </div>
  );
}
