import { useSearchParams } from 'react-router-dom';

import { Title } from '@/components/ui';
import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Card } from '@/components/ui/composites/Card';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';

export const PaymentFail = () => {
  const [searchParams] = useSearchParams();
  const { navigateWithUtm } = useNavigateWithUtm();

  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <div>
            <Title className="text-2xl font-bold">카드 등록 실패</Title>
            <Text className="mt-2 text-gray-600">
              {errorMessage || '카드 등록 중 오류가 발생했습니다.'}
            </Text>
            {errorCode && (
              <Text className="mt-1 text-sm text-gray-500">
                에러 코드: {errorCode}
              </Text>
            )}
          </div>

          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              onClick={() => navigateWithUtm('/settings')}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={() => navigateWithUtm('/settings')}
              className="flex-1"
            >
              다시 시도
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
