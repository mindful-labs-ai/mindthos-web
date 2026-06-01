import { useEffect } from 'react';

import { cn } from '@/lib/cn';
import { CreditIcon, XIcon } from '@/shared/icons';

interface RegenerateChatAnswerModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  creditCost?: number;
  className?: string;
}

export const RegenerateChatAnswerModal = ({
  open,
  onClose,
  onConfirm,
  creditCost = 5,
  className,
}: RegenerateChatAnswerModalProps) => {
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
      className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="regenerate-chat-answer-title"
    >
      <div
        className={cn(
          'relative flex w-full max-w-lg flex-col items-center rounded-2xl bg-surface px-6 pb-6 pt-7',
          className
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-md text-grey-40 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-70"
          aria-label="닫기"
        >
          <XIcon size={20} />
        </button>

        <h2
          id="regenerate-chat-answer-title"
          className="text-center text-xl font-headline text-grey-100"
        >
          답변 다시 생성하기
        </h2>

        <div className="mt-[40px] flex flex-col items-center text-center">
          <p className="text-l font-emphasize text-grey-100">
            답변을 다시 생성하시겠습니까?
          </p>
          <p className="text-grey-50 mt-2 text-m font-medium">
            기존 답변 내용은 저장되지 않습니다.
          </p>
        </div>

        <div className="mt-[30px] flex items-center gap-1 rounded-lg bg-green-20 px-3 py-1">
          <span className="text-m font-headline text-green-80">
            {creditCost}
          </span>
          <CreditIcon size={14} />
          <span className="text-m font-medium text-green-80">사용</span>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="mt-2 flex h-12 w-full max-w-[431px] items-center justify-center rounded-lg bg-primary text-m font-emphasize text-white transition-opacity lg:hover:opacity-90"
        >
          생성하기
        </button>
      </div>
    </div>
  );
};
