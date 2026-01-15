import React from 'react';

import { Text } from '@/components/ui/atoms/Text';
import { PopUp } from '@/components/ui/composites/PopUp';
import {
  MoreVerticalIcon,
  LogInIcon,
  ListChecksIcon,
  Trash2Icon,
  ArrowRightIcon,
} from '@/shared/icons';

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

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="presentation"
    >
      <PopUp
        trigger={
          <button
            className="translate-x-3 rounded-lg p-1 text-fg-muted transition-colors hover:bg-surface-contrast"
            aria-label="메뉴"
          >
            <MoreVerticalIcon size={20} />
          </button>
        }
        content={
          isCounselDone ? (
            // 종결된 클라이언트 메뉴
            <div className="w-[200px]">
              <button
                onClick={handleRestartCounseling}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-contrast"
              >
                <ArrowRightIcon size={20} className="text-fg" />
                <Text className="text-sm font-medium">상담 재시작</Text>
              </button>
            </div>
          ) : (
            // 활성 클라이언트 메뉴
            <div className="w-[200px] space-y-1">
              <button
                onClick={handleCloseSession}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-contrast"
              >
                <LogInIcon size={18} className="text-fg-muted" />
                <Text className="text-sm">상담 종결</Text>
              </button>
              <button
                onClick={handleEditClient}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-contrast"
              >
                <ListChecksIcon size={18} className="text-fg-muted" />
                <Text className="text-sm">내담자 정보 수정</Text>
              </button>
              <button
                onClick={handleDeleteClient}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-contrast"
              >
                <Trash2Icon size={18} className="text-danger" />
                <Text className="text-sm">삭제</Text>
              </button>
            </div>
          )
        }
        placement="bottom-left"
        open={isOpen}
        onOpenChange={onOpenChange}
        className="translate-y-0 p-2"
      />
    </div>
  );
};
