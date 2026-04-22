import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

// ─────────────────────────────────────────────────────────────────────────────
// 삭제 확인 모달 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** 모달 제목 (기본값: '구성원 삭제') */
  title?: string;
  /** 삭제 대상 이름 (지정 시 "{name} 가족 구성원을 삭제하시겠습니까?" 표시) */
  name?: string;
  /** 커스텀 메시지 (name 미지정 시 사용, 기본값: '이 관계를 삭제하시겠습니까?') */
  message?: string;
  /** 닫기 버튼 aria-label */
  closeAriaLabel?: string;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '구성원 삭제',
  name,
  message,
  closeAriaLabel = '모달 닫기',
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  const displayMessage = name
    ? `${name} 가족 구성원을 삭제하시겠습니까?`
    : message || '이 관계를 삭제하시겠습니까?';

  return createPortal(
    <div className="fixed inset-0 z-overlay flex items-center justify-center">
      {/* 백드롭 */}
      <button
        type="button"
        className="absolute inset-0 bg-overlay-bg"
        onClick={onClose}
        aria-label="모달 닫기"
      />
      {/* 모달 */}
      <div className="relative w-[400px] rounded-2xl bg-surface px-8 py-10">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          aria-label={closeAriaLabel}
          className="absolute right-4 top-4 p-1 text-fg-muted lg:hover:text-fg"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 제목 */}
        <h2 className="typo-xl mb-8 text-center font-headline text-fg">
          {title}
        </h2>

        {/* 내용 */}
        <p className="typo-l mb-2 text-center font-medium text-fg">
          {displayMessage}
        </p>
        <p className="typo-sm mb-10 text-center text-fg-muted">
          한 번 삭제하면 해당 정보를 다시 불러올 수 없어요.
          <br />
          그래도 삭제하시겠습니까?
        </p>

        {/* 삭제 버튼 */}
        <button
          onClick={onConfirm}
          className="typo-l lg:hover:bg-primary-600 h-14 w-full rounded-xl bg-primary font-medium text-primary-fg transition-colors"
        >
          삭제하기
        </button>
      </div>
    </div>,
    document.body
  );
}
