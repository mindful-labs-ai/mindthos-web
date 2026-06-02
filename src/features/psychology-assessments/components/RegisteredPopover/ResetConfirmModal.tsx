import { useEffect } from 'react';

import { cn } from '@/lib/cn';
import { DangerExclamationIcon, XIcon } from '@/shared/icons';

interface ResetConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** 타이틀 (e.g. '심리검사 결과지 초기화') */
  title?: string;
  question?: string;
  description?: string;
  confirmLabel?: string;
  className?: string;
}

export const ResetConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title = '심리검사 결과지 초기화',
  question = '등록된 결과지를 모두 초기화하시겠어요?',
  description = '초기화하면 분석 내용과 채팅 내용이 함께 삭제되어\n처음부터 다시 진행해야 합니다.',
  confirmLabel = '초기화하기',
  className,
}: ResetConfirmModalProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[calc(var(--z-popover)+1)] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
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
          <DangerExclamationIcon size={24} className="text-[#EF4444]" />
          <h2 className="text-m font-emphasize text-grey-100">{title}</h2>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-m font-emphasize text-grey-100">{question}</p>
          <p className="whitespace-pre-line text-sm text-grey-60">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-primary text-m font-emphasize text-white transition-opacity lg:hover:opacity-90"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
};
