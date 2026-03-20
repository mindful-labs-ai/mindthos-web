import { useEffect } from 'react';

import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { Modal } from '@/shared/ui/composites/Modal';

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
      trackEvent(MixpanelEvent.ComingSoonModalOpened, { source });
    }
  }, [open, source]);

  return (
    <Modal open={open} onOpenChange={onOpenChange} className="max-w-[480px]">
      <div className="flex flex-col items-center px-4 py-6">
        {/* 제목 */}
        <h2 className="typo-2xl font-headline text-fg">출시 예정 기능</h2>

        {/* 확인 문구 */}
        <p className="typo-l mt-8 text-center font-medium text-fg">
          해당 기능은 현재 개발 중입니다.
        </p>

        {/* 설명 */}
        <p className="typo-sm mt-4 text-center text-fg-muted">
          기능이 출시되면 업데이트 알림을 통해
          <br />
          소식을 알려드릴게요.
        </p>

        {/* 완료 버튼 */}
        <button
          onClick={() => onOpenChange(false)}
          className="typo-l hover:bg-primary-400 mt-10 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 font-medium text-primary-fg transition-colors"
        >
          확인
        </button>
      </div>
    </Modal>
  );
}
