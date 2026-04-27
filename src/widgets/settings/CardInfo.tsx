import React, { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { billingService } from '@/shared/api/supabase/billingQueries';
import { getCardBrandName } from '@/shared/constants/card';
import { cardQueryKeys } from '@/shared/constants/queryKeys';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';
import { Modal } from '@/shared/ui/composites/Modal';
import { useToast } from '@/shared/ui/composites/Toast';
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
  onAdd,
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
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.info(userId!) });
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      toast({
        title: '카드 삭제 완료',
        description: '카드를 삭제했어요.',
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
            : '카드를 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.',
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
    <div className="flex items-center justify-between gap-3 border-grey-30 bg-white p-3 md:rounded-xl md:border">
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
              <Text className="typo-sm text-left font-medium text-fg">
                {getCardBrandName(company) || cardType}카드
              </Text>
              <Text className="typo-xs text-fg-muted">
                {formatCardNumber(cardNumber)}
              </Text>
            </>
          ) : (
            <>
              <Text className="typo-sm text-left font-medium text-fg">
                등록된 카드가 없어요.
              </Text>
              <Text className="typo-xs text-fg-muted">
                첫 결제 시 카드 등록이 함께 진행돼요.
              </Text>
            </>
          )}
        </div>
      </div>
      {isRegistered ? (
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="rounded-md border border-grey-30 px-3 py-1 text-m font-medium text-red-80 transition-colors lg:hover:bg-grey-10 lg:hover:text-red-50"
        >
          {isDeleting ? '삭제 중...' : '삭제'}
        </button>
      ) : (
        <button
          onClick={onAdd}
          className="whitespace-nowrap rounded-md border border-grey-30 px-3 py-1 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10"
        >
          카드 등록
        </button>
      )}

      {/* 카드 삭제 확인 모달 */}
      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="카드 삭제"
        className="max-w-sm"
      >
        <div className="space-y-4">
          <Text className="typo-m text-fg">
            등록된 카드를 삭제하시겠어요?
          </Text>
          <Text className="typo-sm text-fg-muted">
            삭제 후에는 결제 시 카드를 다시 등록해야 해요.
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
