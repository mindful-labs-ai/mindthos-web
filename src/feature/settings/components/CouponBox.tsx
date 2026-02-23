import React, { useState } from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Input } from '@/components/ui/atoms/Input';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Modal } from '@/components/ui/composites/Modal';
import { Spinner } from '@/components/ui/composites/Spinner';
import { cn } from '@/lib/cn';

import type { Coupon } from '../types/coupon';

/** ISO 날짜 → "2026년 2월 28일까지" */
function formatExpiresAt(iso: string): string {
  const date = new Date(iso);
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}년 ${m}월 ${d}일까지`;
}

// --- CouponCard ---

interface CouponCardProps {
  coupon: Coupon;
  size?: 'lg' | 'sm';
  selectable?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

const CouponCard: React.FC<CouponCardProps> = ({
  coupon,
  size = 'lg',
  selectable = false,
  selected = false,
  onClick,
}) => {
  return (
    <div
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
      className={cn(
        'relative rounded-xl border border-[#E0E0E0] bg-[#F5F5F5] px-4 py-5',
        size === 'lg' ? 'h-[117px] w-full' : '',
        selectable && 'cursor-pointer transition-colors hover:bg-[#ECECEC]',
        selectable &&
          selected &&
          'hover:bg-primary-10 border border-primary bg-primary-50'
      )}
      onClick={selectable ? onClick : undefined}
      onKeyDown={
        selectable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="items flex flex-1 flex-col">
          <Text
            className={cn(
              'font-semibold leading-relaxed text-[#333]',
              size === 'lg' ? 'text-lg' : 'text-base'
            )}
          >
            {coupon.title}
          </Text>
          <Text
            className={cn(
              'text-fg-muted',
              size === 'lg' ? 'mt-2 text-sm' : 'mt-1 text-xs'
            )}
          >
            {formatExpiresAt(coupon.expiresAt)}
          </Text>
        </div>
        {selectable && (
          <div className="absolute bottom-3 right-3">
            <svg
              className={cn(
                selected ? 'text-primary' : 'text-[#C8C8C8]',
                size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
              )}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

// --- CouponBox Props ---

interface CouponBoxBaseProps {
  coupons: Coupon[];
  isLoading?: boolean;
}

interface CouponBoxModalProps extends CouponBoxBaseProps {
  variant: 'modal';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 성공 시 true, 실패 시 false 반환 */
  onRegister: (code: string) => Promise<boolean>;
  registerError?: string | null;
  isRegistering?: boolean;
}

interface CouponBoxDropdownProps extends CouponBoxBaseProps {
  variant: 'dropdown';
  onSelect: (coupon: Coupon | null) => void;
  selectedCouponId?: string | null;
  onClose: () => void;
}

type CouponBoxProps = CouponBoxModalProps | CouponBoxDropdownProps;

// --- Modal Variant ---

const CouponBoxModal: React.FC<CouponBoxModalProps> = ({
  coupons,
  isLoading,
  open,
  onOpenChange,
  onRegister,
  registerError,
  isRegistering,
}) => {
  const [code, setCode] = useState('');

  const handleRegister = async () => {
    if (!code.trim() || isRegistering) return;
    const success = await onRegister(code.trim());
    if (success) setCode('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-lg px-6 py-8"
    >
      <div className="flex flex-col items-center">
        <Title as="h2" className="mb-6 text-2xl font-bold">
          나의 쿠폰함
        </Title>

        {/* 쿠폰 등록 */}
        <div className="w-full">
          <Text className="mb-2 text-sm font-medium text-fg">
            쿠폰 등록하기
          </Text>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="번호를 입력해주세요."
              size="md"
              variant="outline"
              className="flex-1"
            />
            <Button
              variant="outline"
              tone="neutral"
              size="md"
              onClick={handleRegister}
              disabled={isRegistering}
              className="min-w-[72px]"
            >
              {isRegistering ? '등록 중' : '등록'}
            </Button>
          </div>
          {registerError && (
            <Text className="ml-1 mt-1 text-sm text-red-500">
              {registerError}
            </Text>
          )}
        </div>

        <hr className="my-6 w-full border-border" />

        {/* 쿠폰 리스트 */}
        <div className="custom-scrollbar max-h-[400px] w-full space-y-3 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="sm" ariaLabel="쿠폰 불러오는 중" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Text className="text-fg-muted">보유 중인 쿠폰이 없습니다.</Text>
            </div>
          ) : (
            coupons.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} />
            ))
          )}
        </div>

        {/* 확인 버튼 */}
        <Button
          variant="solid"
          tone="primary"
          size="lg"
          onClick={() => onOpenChange(false)}
          className="mt-8 w-full max-w-sm"
        >
          확인
        </Button>
      </div>
    </Modal>
  );
};

// --- Dropdown Variant ---

const CouponBoxDropdown: React.FC<CouponBoxDropdownProps> = ({
  coupons,
  isLoading,
  onSelect,
  selectedCouponId,
  onClose,
}) => {
  const [internalSelected, setInternalSelected] = useState<string | null>(
    selectedCouponId ?? null
  );

  const handleCouponClick = (coupon: Coupon) => {
    setInternalSelected((prev) => (prev === coupon.id ? null : coupon.id));
  };

  const isRemoving = !internalSelected && !!selectedCouponId;

  const handleConfirm = () => {
    const selected = coupons.find((c) => c.id === internalSelected) ?? null;
    onSelect(selected);
    onClose();
  };

  return (
    <div
      className={cn(
        'w-[320px] rounded-xl border-2 border-border bg-surface p-5 shadow-xl',
        'animate-[scaleIn_0.15s_ease-out]'
      )}
    >
      <Title as="h3" className="mb-4 text-lg font-bold">
        사용 가능한 쿠폰
      </Title>

      <div className="custom-scrollbar max-h-[300px] space-y-3 overflow-y-auto">
        {(() => {
          if (isLoading) {
            return (
              <div className="flex items-center justify-center py-8">
                <Spinner size="sm" ariaLabel="쿠폰 불러오는 중" />
              </div>
            );
          }
          if (coupons.length === 0) {
            return (
              <div className="flex items-center justify-center py-8">
                <Text className="text-fg-muted">
                  사용 가능한 쿠폰이 없습니다.
                </Text>
              </div>
            );
          }
          return coupons.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              size="sm"
              selectable
              selected={internalSelected === coupon.id}
              onClick={() => handleCouponClick(coupon)}
            />
          ));
        })()}
      </div>

      <Button
        variant="outline"
        tone="neutral"
        size="md"
        onClick={handleConfirm}
        disabled={!internalSelected && !isRemoving}
        className="mt-4 w-full"
      >
        {isRemoving ? '해제하기' : '선택하기'}
      </Button>
    </div>
  );
};

// --- Main Component ---

export const CouponBox: React.FC<CouponBoxProps> = (props) => {
  if (props.variant === 'modal') {
    return <CouponBoxModal {...props} />;
  }
  return <CouponBoxDropdown {...props} />;
};
