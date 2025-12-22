import React, { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Modal } from '@/components/ui/composites/Modal';
import { useToast } from '@/components/ui/composites/Toast';
import { getCardBrandName } from '@/feature/payment/constants/card';
import { billingService } from '@/feature/payment/services/billingService';
import { useAuthStore } from '@/stores/authStore';

interface CardInfoProps {
  cardType?: string | null; // '신용' 또는 '체크'
  cardNumber?: string | null; // 전체 혹은 마지막 4자리
  company?: string | null; // 카드사 코드
  onAdd?: () => void;
}

/**
 * 카드 번호를 0000-00** 형태로 포맷
 */
const formatCardNumber = (cardNumber?: string | null): string => {
  if (!cardNumber) return '';
  const startFour = cardNumber.slice(0, 4);
  const lastFour = cardNumber.slice(-4);
  return `${startFour}-****-****-${lastFour}`;
};

export const CardInfo: React.FC<CardInfoProps> = ({
  cardType,
  cardNumber,
  company,
  // onAdd,
}) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const isRegistered = !!cardType && !!cardNumber;

  const deleteCardMutation = useMutation({
    mutationFn: async () => {
      await billingService.deleteCard();
    },
    onSuccess: () => {
      // 카드 정보 쿼리 무효화하여 UI 업데이트
      queryClient.invalidateQueries({ queryKey: ['cardInfo', userId] });
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      toast({
        title: '카드 삭제 완료',
        description: '등록된 카드가 삭제되었습니다.',
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('카드 삭제 실패:', error);
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      toast({
        title: '카드 삭제 실패',
        description:
          error instanceof Error
            ? error.message
            : '카드 삭제에 실패했습니다. 다시 시도해주세요.',
        duration: 5000,
      });
    },
  });

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    setIsDeleting(true);
    deleteCardMutation.mutate();
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface p-3">
      <div className="flex flex-1 items-center gap-3">
        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-md">
          <svg
            className="h-6 w-6 text-primary"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <div className="flex flex-col">
          {isRegistered ? (
            <>
              <Text className="text-left text-sm font-medium text-fg">
                {getCardBrandName(company) || cardType}카드
              </Text>
              <Text className="text-xs text-fg-muted">
                {formatCardNumber(cardNumber)}
              </Text>
            </>
          ) : (
            <>
              <Text className="text-left text-sm font-medium text-fg">
                등록된 카드가 없습니다.
              </Text>
              <Text className="text-xs text-fg-muted">
                첫 결제 시 카드 등록이 함께 진행됩니다.
              </Text>
            </>
          )}
        </div>
      </div>
      {isRegistered ? (
        <Button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          variant="ghost"
          size="sm"
          className="hover:text-error text-fg-muted"
        >
          {isDeleting ? '삭제 중...' : '삭제'}
        </Button>
      ) : (
        // <Button
        //   onClick={onAdd}
        //   variant="outline"
        //   size="sm"
        //   className="whitespace-nowrap"
        // >
        //   카드 등록
        // </Button>
        <></>
      )}

      {/* 카드 삭제 확인 모달 */}
      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="카드 삭제"
        className="max-w-sm"
      >
        <div className="space-y-4">
          <Text className="text-base text-fg">
            등록된 카드를 삭제하시겠습니까?
          </Text>
          <Text className="text-sm text-fg-muted">
            삭제 후에는 결제 시 카드를 다시 등록해야 합니다.
          </Text>
          <div className="flex justify-center gap-2 pt-2">
            <Button
              onClick={handleCancelDelete}
              variant="outline"
              size="md"
              className="w-full"
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="solid"
              tone="danger"
              size="md"
              className="w-full"
              disabled={isDeleting}
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
