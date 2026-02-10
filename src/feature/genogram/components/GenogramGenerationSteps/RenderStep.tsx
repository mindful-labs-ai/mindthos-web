import { Check } from 'lucide-react';

import { Alert } from '@/components/ui/atoms/Alert';
import { Button } from '@/components/ui/atoms/Button';

import { GenogramLoadingAnimation } from '../GenogramLoadingAnimation';

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
  // props에서 직접 상태 계산
  const status = error ? 'error' : isPending ? 'processing' : 'success';

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
