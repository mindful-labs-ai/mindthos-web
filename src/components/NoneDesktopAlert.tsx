import { useState } from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Modal } from '@/components/ui/composites/Modal';
import { useDevice } from '@/shared/hooks/useDevice';

const STORAGE_KEY = 'mindthos_none_desktop_alert_dismissed';

export const NoneDesktopAlert = () => {
  const { isDesktop } = useDevice();
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    return !dismissed;
  });

  const handleConfirm = () => {
    setOpen(false);
  };

  const handleDismissForever = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  };

  if (isDesktop) return null;

  return (
    <Modal open={open} onOpenChange={setOpen} closeOnOverlay={false}>
      <div className="flex flex-col items-center px-4 py-6 text-center">
        <h2 className="text-xl font-bold text-fg">모바일 이용 안내</h2>

        <p className="mt-6 text-fg">
          현재 마음토스는 PC에 최적화되어 있습니다.
          <br />
          PC 환경에서의 사용을 적극 권장합니다.
        </p>

        <div className="mt-8 flex w-full items-center gap-3">
          <Button
            variant="ghost"
            tone="neutral"
            className="flex-1 text-fg-muted"
            onClick={handleDismissForever}
          >
            다시 보지 않기
          </Button>
          <Button
            variant="solid"
            tone="primary"
            className="flex-1"
            onClick={handleConfirm}
          >
            확인
          </Button>
        </div>
      </div>
    </Modal>
  );
};
