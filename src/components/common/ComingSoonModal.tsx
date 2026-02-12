import { useEffect } from 'react';

import { Modal } from '@/components/ui/composites/Modal';
import { trackEvent } from '@/lib/mixpanel';

interface ComingSoonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: string;
}

export function ComingSoonModal({
  open,
  onOpenChange,
  source,
}: ComingSoonModalProps) {
  // 모달이 열릴 때 이벤트 트래킹
  useEffect(() => {
    if (open && source) {
      trackEvent('coming_soon_modal_opened', { source });
    }
  }, [open, source]);

  return (
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-[480px]">
      <div className="flex flex-col items-center px-4 py-6">
        {/* 제목 */}
        <h2 className="text-2xl font-bold text-fg">출시 예정 기능</h2>

        {/* 확인 문구 */}
        <p className="mt-8 text-center text-lg font-medium text-fg">
          해당 기능은 현재 개발 중입니다.
        </p>

        {/* 설명 */}
        <p className="mt-4 text-center text-sm text-fg-muted">
          기능이 출시되면 업데이트 알림을 통해
          <br />
          소식을 알려드릴게요.
        </p>

        {/* 완료 버튼 */}
        <button
          onClick={() => onOpenChange(false)}
          className="mt-10 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-lg font-medium text-white transition-colors hover:bg-primary-400"
        >
          확인
        </button>
      </div>
    </Modal>
  );
}
