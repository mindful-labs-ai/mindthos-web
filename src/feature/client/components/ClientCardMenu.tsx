import React from 'react';

import { Text } from '@/components/ui/atoms/Text';
import { PopUp } from '@/components/ui/composites/PopUp';
import {
  MoreVerticalIcon,
  LogInIcon,
  ListChecksIcon,
  Trash2Icon,
} from '@/shared/icons';

interface ClientCardMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseSession: () => void;
  onEditClient: () => void;
  onDeleteClient: () => void;
}

export const ClientCardMenu: React.FC<ClientCardMenuProps> = ({
  isOpen,
  onOpenChange,
  onCloseSession,
  onEditClient,
  onDeleteClient,
}) => {
  const handleCloseSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCloseSession();
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
        }
        placement="bottom-left"
        open={isOpen}
        onOpenChange={onOpenChange}
        className="translate-y-0 p-2"
      />
    </div>
  );
};
