import React from 'react';

import { useDevice } from '@/shared/hooks/useDevice';
import {
  MoreVerticalIcon,
  LogInIcon,
  ListChecksIcon,
  Trash2Icon,
  ArrowRightIcon,
} from '@/shared/icons';
import { Text } from '@/shared/ui/atoms/Text';
import { Modal } from '@/shared/ui/composites/Modal';
import { PopUp } from '@/shared/ui/composites/PopUp';

interface ClientCardMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isCounselDone?: boolean;
  onCloseSession: () => void;
  onRestartCounseling: () => void;
  onEditClient: () => void;
  onDeleteClient: () => void;
}

export const ClientCardMenu: React.FC<ClientCardMenuProps> = ({
  isOpen,
  onOpenChange,
  isCounselDone = false,
  onCloseSession,
  onRestartCounseling,
  onEditClient,
  onDeleteClient,
}) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  const handleCloseSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCloseSession();
  };

  const handleRestartCounseling = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRestartCounseling();
  };

  const handleEditClient = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditClient();
  };

  const handleDeleteClient = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteClient();
  };

  // 데스크탑 PopUp용 메뉴 (아이콘 포함)
  const desktopMenuContent = isCounselDone ? (
    <div className="w-full">
      <button
        onClick={handleRestartCounseling}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-contrast"
      >
        <ArrowRightIcon size={20} className="text-fg" />
        <Text className="typo-sm font-medium">상담 재시작</Text>
      </button>
    </div>
  ) : (
    <div className="w-full space-y-1">
      <button
        onClick={handleCloseSession}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-contrast"
      >
        <LogInIcon size={18} className="text-fg-muted" />
        <Text className="typo-sm">상담 종결</Text>
      </button>
      <button
        onClick={handleEditClient}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-contrast"
      >
        <ListChecksIcon size={18} className="text-fg-muted" />
        <Text className="typo-sm">내담자 정보 수정</Text>
      </button>
      <button
        onClick={handleDeleteClient}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-contrast"
      >
        <Trash2Icon size={18} className="text-danger" />
        <Text className="typo-sm">삭제</Text>
      </button>
    </div>
  );

  // 모바일 바텀시트용 메뉴 (아이콘 없음, TranscriptToolbar 스타일)
  const mobileMenuContent = isCounselDone ? (
    <div className="mb-16 w-full">
      <button
        onClick={handleRestartCounseling}
        className="flex w-full items-center rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface"
      >
        <span className="text-m text-grey-100 md:text-l">상담 재시작</span>
      </button>
    </div>
  ) : (
    <div className="mb-16 w-full space-y-1">
      <button
        onClick={handleCloseSession}
        className="flex w-full items-center rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface"
      >
        <span className="text-m text-grey-100 md:text-l">상담 종결</span>
      </button>
      <button
        onClick={handleEditClient}
        className="flex w-full items-center rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface"
      >
        <span className="text-m text-grey-100 md:text-l">내담자 정보 수정</span>
      </button>
      <button
        onClick={handleDeleteClient}
        className="flex w-full items-center rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface"
      >
        <span className="text-m text-red-80 md:text-l">삭제</span>
      </button>
    </div>
  );

  const triggerButton = (
    <button
      className="translate-x-3 rounded-lg p-1 text-fg-muted transition-colors hover:bg-surface-contrast"
      aria-label="메뉴"
    >
      <MoreVerticalIcon size={20} />
    </button>
  );

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="presentation"
    >
      {isMobileView ? (
        <>
          <div
            role="button"
            tabIndex={0}
            onClick={() => onOpenChange(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onOpenChange(true);
            }}
          >
            {triggerButton}
          </div>
          <Modal
            open={isOpen}
            onOpenChange={onOpenChange}
            mobileVariant="bottomSheet"
          >
            {mobileMenuContent}
          </Modal>
        </>
      ) : (
        <PopUp
          trigger={triggerButton}
          content={
            isCounselDone ? (
              <div className="w-[200px]">{desktopMenuContent}</div>
            ) : (
              <div className="w-[200px] space-y-1">{desktopMenuContent}</div>
            )
          }
          placement="bottom-left"
          open={isOpen}
          onOpenChange={onOpenChange}
          className="translate-y-0 p-2"
        />
      )}
    </div>
  );
};
