import { useEffect, useState } from 'react';

import { Check, Loader2 } from 'lucide-react';

import { Alert } from '@/components/ui/atoms/Alert';
import { Button } from '@/components/ui/atoms/Button';

interface RenderStepProps {
  error: string | null;
  onComplete: () => void;
}

export function RenderStep({ error, onComplete }: RenderStepProps) {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>(
    error ? 'error' : 'processing'
  );

  // 렌더링은 부모에서 처리, 여기서는 완료 UI만 표시
  useEffect(() => {
    // 에러가 있으면 초기 상태에서 이미 'error'로 설정됨
    if (error) {
      return;
    }

    // 짧은 딜레이 후 성공 표시 (UX 개선)
    const timer = setTimeout(() => {
      setStatus('success');
    }, 500);
    return () => clearTimeout(timer);
  }, [error]);

  return (
    <div className="space-y-6 py-8">
      {status === 'processing' && (
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-fg-muted">가계도를 렌더링하는 중...</p>
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
