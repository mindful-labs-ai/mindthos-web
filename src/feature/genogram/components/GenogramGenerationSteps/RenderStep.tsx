import { useEffect, useState } from 'react';

import { Check } from 'lucide-react';

import { Alert } from '@/components/ui/atoms/Alert';
import { Button } from '@/components/ui/atoms/Button';

import { GenogramLoadingAnimation } from '../GenogramLoadingAnimation';

// 2단계 애니메이션 지속 시간 (GenogramLoadingAnimation의 총 재생 시간과 일치)
const RENDER_ANIMATION_DURATION = 3200;

interface RenderStepProps {
  error: string | null;
  onComplete: () => void;
}

export function RenderStep({ error, onComplete }: RenderStepProps) {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>(
    error ? 'error' : 'processing'
  );

  // 고정 시간 후 성공 표시 (애니메이션 완료 시점)
  useEffect(() => {
    if (error) {
      return;
    }

    const timer = setTimeout(() => {
      setStatus('success');
    }, RENDER_ANIMATION_DURATION);
    return () => clearTimeout(timer);
  }, [error]);

  return (
    <div className="space-y-6 py-8">
      {status === 'processing' && (
        <div className="flex flex-col items-center justify-center">
          <GenogramLoadingAnimation />
        </div>
      )}

      {status === 'success' && (
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
        <Alert tone="danger">{error || '렌더링 중 오류가 발생했습니다.'}</Alert>
      )}

      {/* 완료 버튼 */}
      {status === 'success' && (
        <div className="flex justify-center">
          <Button onClick={onComplete} tone="primary">
            가계도 확인하기
          </Button>
        </div>
      )}
    </div>
  );
}
