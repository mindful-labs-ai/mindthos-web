import { Modal } from '@/components/ui/composites/Modal';

interface SegmentDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SegmentDeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: SegmentDeleteConfirmModalProps) {
  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      className="max-w-[480px]"
    >
      <div className="flex flex-col items-center px-6 py-4">
        {/* 제목 */}
        <h2 className="text-2xl font-bold text-fg">대화 내용 삭제</h2>

        {/* 확인 문구 */}
        <p className="mt-4 text-center text-lg font-medium text-fg">
          해당 대화 내용을 삭제하시겠습니까?
        </p>

        {/* 설명 */}
        <p className="mb-4 text-sm text-fg-muted">
          삭제된 내용은 다시 되돌릴 수 없어요.
        </p>

        {/* 초기화 버튼 */}
        <button
          onClick={onConfirm}
          className="hover:bg-primary-500/90 mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-lg font-medium text-white transition-colors"
        >
          삭제하기
        </button>
      </div>
    </Modal>
  );
}
