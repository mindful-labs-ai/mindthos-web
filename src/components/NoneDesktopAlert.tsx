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
          현재 모바일 환경에서는 음성 파일 업로드 기능만 지원하고 있습니다.
          상담기록, AI 수퍼비전 등 마음토스의 다른 기능을 사용하기 위해서는 PC
          환경에서 로그인해주세요.
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
