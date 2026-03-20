import { Loader2 } from 'lucide-react';

import { Modal } from '@/shared/ui/composites/Modal';

interface ResetConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ResetConfirmModal({
  open,
  onOpenChange,
  clientName,
  onConfirm,
  isLoading = false,
}: ResetConfirmModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-[480px]">
      <div className="flex flex-col items-center px-4 py-6">
        {/* 제목 */}
        <h2 className="typo-2xl font-headline text-fg">가계도 초기화</h2>

        {/* 확인 문구 */}
        <p className="mt-8 text-center typo-l font-medium text-fg">
          {clientName}의 가계도를 초기화하시겠습니까?
        </p>

        {/* 설명 */}
        <p className="mt-4 text-center typo-sm text-fg-muted">
          초기화하면 지금까지 제작된 가계도 내용은
          <br />
          모두 삭제되고, 다시 불러올 수 없어요.
        </p>

        {/* 초기화 버튼 */}
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="hover:bg-primary/90 mt-10 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 typo-l font-medium text-primary-fg transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>초기화 중...</span>
            </>
          ) : (
            <span>초기화하기</span>
          )}
        </button>
      </div>
    </Modal>
  );
}
