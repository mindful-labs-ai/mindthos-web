import React from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Modal } from '@/components/ui/composites/Modal';
import { CheckIcon, HelpCircleIcon } from '@/shared/icons';
import { formatPrice } from '@/shared/utils/format';

type PaymentStatus = 'success' | 'failure';

export interface PaymentResultModalProps {
  open: boolean;
  status: PaymentStatus;
  planName?: string;
  period?: { start: string; end: string };
  cardInfo?: {
    type?: string | null;
    number?: string;
  };
  amount?: number;
  reason?: string;
  onClose: () => void;
}

// 카드 번호 4자리 단위 하이픈 처리 (마스킹 그대로 유지)
const formatCardNumber = (number?: string) => {
  if (!number) return '-';
  return number.replace(/(.{4})(?=.)/g, '$1-');
};

const getCardDisplay = (cardInfo?: {
  type?: string | null;
  number?: string;
}) => {
  if (!cardInfo) return '등록된 카드가 없습니다';
  const prefix = cardInfo.type ?? '등록 카드';
  return `${prefix} ${formatCardNumber(cardInfo.number)}`;
};

export const PaymentResultModal: React.FC<PaymentResultModalProps> = ({
  open,
  status,
  planName,
  period,
  cardInfo,
  amount,
  reason,
  onClose,
}) => {
  const isSuccess = status === 'success';
  const title = isSuccess ? '결제 성공' : '결제 실패';
  const description = isSuccess
    ? `${planName || '선택한'} 플랜으로 성공적으로 변경되었습니다.`
    : '등록한 카드 정보를 다시 확인해주세요.';

  const infoItems = isSuccess
    ? [
        {
          label: '이용 기간',
          value: period ? `${period.start} ~ ${period.end}` : '-',
        },
        {
          label: '결제 카드',
          value: getCardDisplay(cardInfo),
        },
        {
          label: '결제 금액',
          value: amount !== undefined ? `${formatPrice(amount)}원` : '-',
          bold: true,
        },
      ]
    : [
        {
          label: '결제 카드',
          value: getCardDisplay(cardInfo),
        },
        {
          label: '결제 금액',
          value: amount !== undefined ? `${formatPrice(amount)}원` : '-',
          bold: true,
        },
        {
          label: '실패 사유',
          value: reason || '결제에 실패했습니다. 다시 시도해주세요.',
        },
      ];

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      className="max-w-lg"
    >
      <div className="space-y-8 p-4">
        <div className="space-y-4 text-center">
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${isSuccess ? 'bg-primary-100 text-primary' : 'bg-danger/10 text-danger'}`}
          >
            {isSuccess ? <CheckIcon size={28} /> : <HelpCircleIcon size={28} />}
          </div>
          <Title as="h2" className="text-2xl font-bold">
            {title}
          </Title>
          <Text className="text-lg font-semibold text-fg">{description}</Text>
        </div>

        <div className="rounded-2xl border border-border bg-surface-contrast p-6">
          <div className="space-y-6">
            {infoItems.map((item) => (
              <div key={item.label} className="space-y-1 text-start">
                <Text className="text-sm text-fg-muted">{item.label}</Text>
                <Text
                  className={`text-base ${item.bold ? 'font-bold text-fg' : 'font-semibold text-fg'}`}
                >
                  {item.value}
                </Text>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            variant="solid"
            tone="primary"
            size="lg"
            className="w-full max-w-xs"
            onClick={onClose}
          >
            확인
          </Button>
        </div>
      </div>
    </Modal>
  );
};
