import React, { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { billingService } from '@/feature/payment/services/billingService';
import { useAuthStore } from '@/stores/authStore';

interface CardInfoProps {
  cardType?: string | null; // '신용' 또는 '체크'
  cardNumber?: string | null; // 전체 혹은 마지막 4자리
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
  // onAdd,
}) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.userId);
  const [isDeleting, setIsDeleting] = useState(false);
  const isRegistered = !!cardType && !!cardNumber;

  const deleteCardMutation = useMutation({
    mutationFn: async () => {
      await billingService.deleteCard();
    },
    onSuccess: () => {
      // 카드 정보 쿼리 무효화하여 UI 업데이트
      queryClient.invalidateQueries({ queryKey: ['cardInfo', userId] });
      setIsDeleting(false);
    },
    onError: (error) => {
      console.error('카드 삭제 실패:', error);
      alert('카드 삭제에 실패했습니다.');
      setIsDeleting(false);
    },
  });

  const handleDeleteCard = () => {
    if (confirm('등록된 카드를 삭제하시겠습니까?')) {
      setIsDeleting(true);
      deleteCardMutation.mutate();
    }
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
                {cardType}카드
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
          onClick={handleDeleteCard}
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
    </div>
  );
};
