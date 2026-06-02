import { useEffect } from 'react';

import { cn } from '@/lib/cn';
import { CreditIcon, XIcon } from '@/shared/icons';

interface FirstChatCreditConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  creditCost?: number;
  className?: string;
}

export const FirstChatCreditConfirmModal = ({
  open,
  onClose,
  onConfirm,
  creditCost = 5,
  className,
}: FirstChatCreditConfirmModalProps) => {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[calc(var(--z-popover)+1)] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-chat-credit-title"
      aria-describedby="first-chat-credit-description"
    >
      <div
        className={cn(
          'relative flex w-full max-w-[420px] flex-col items-center gap-5 rounded-2xl bg-surface px-6 py-7 shadow-prominent',
          className
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-md text-grey-60 transition-colors lg:hover:bg-grey-10"
          aria-label="닫기"
        >
          <XIcon size={18} />
        </button>

        <div className="flex items-center gap-2">
          <h2
            id="first-chat-credit-title"
            className="text-m font-emphasize text-grey-100"
          >
            질문을 보내시겠어요?
          </h2>
        </div>

        <div
          id="first-chat-credit-description"
          className="flex flex-col items-center gap-3 text-center"
        >
          <p className="text-m font-emphasize text-grey-100">
            질문을 보내면 크레딧이 차감돼요.
          </p>

          <p className="text-sm text-grey-60">
            검사 결과지를 바탕으로 답변을 생성합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-m font-emphasize text-white transition-opacity lg:hover:opacity-90"
        >
          질문하기
          <div className="flex items-center gap-1">
            <span className="text-m font-headline">{creditCost}</span>
            <CreditIcon color="white" size={14} />
          </div>
        </button>
      </div>
    </div>
  );
};
