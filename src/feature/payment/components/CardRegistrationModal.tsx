import { useState } from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Modal } from '@/components/ui/composites/Modal';
import { useToast } from '@/components/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';

import { useTossPayments } from '../hooks/useTossPayments';

export interface CardRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerKey: string;
  onSuccess?: () => void;
}

export const CardRegistrationModal = ({
  isOpen,
  onClose,
  customerKey,
  onSuccess,
}: CardRegistrationModalProps) => {
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const userName = useAuthStore((state) => state.userName);
  const {
    requestBillingAuth,
    isLoading: isSdkLoading,
    error: sdkError,
  } = useTossPayments(customerKey);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!userName || !user?.email) {
      toast({
        title: '사용자 정보 오류',
        description: '사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await requestBillingAuth({
        customerName: userName,
        customerEmail: user.email,
      });
      onSuccess?.();
    } catch (error) {
      toast({
        title: '카드 등록 실패',
        description:
          error instanceof Error
            ? error.message
            : '카드 등록 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      className="max-w-xl"
      onOpenChange={(open) => !open && onClose()}
    >
      <div className="flex flex-col gap-6 p-6">
        <div>
          <Text className="text-xl font-semibold">카드 등록</Text>
          <Text className="mt-2 text-sm text-gray-600">
            정기 결제를 위한 카드 정보를 등록해주세요.
          </Text>
        </div>

        {sdkError && (
          <div className="rounded-md bg-red-50 p-4">
            <Text className="text-sm text-red-800">
              결제 시스템 초기화 실패: {sdkError.message}
            </Text>
            <Text className="mt-1 text-xs text-red-600">
              환경 변수(VITE_TOSS_PAYMENTS_CLIENT_KEY)를 확인해주세요.
            </Text>
          </div>
        )}

        {isSdkLoading && (
          <div className="rounded-md bg-blue-50 p-4">
            <Text className="text-sm text-blue-800">
              결제 시스템을 초기화하고 있습니다...
            </Text>
          </div>
        )}

        <Text className="text-sm text-gray-600">
          카드 등록하기 버튼을 클릭하면 토스페이먼츠 페이지로 이동하여 카드
          정보를 안전하게 등록할 수 있습니다.
        </Text>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSdkLoading || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? '처리 중...' : '카드 등록하기'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
