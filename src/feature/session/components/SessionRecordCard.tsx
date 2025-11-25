import React from 'react';

import { Badge } from '@/components/ui/atoms/Badge';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Card } from '@/components/ui/composites/Card';
import { PopUp } from '@/components/ui/composites/PopUp';
import { ClientSelector } from '@/feature/client/components/ClientSelector';
import { useClientList } from '@/feature/client/hooks/useClientList';
import type { SessionRecord, NoteType } from '@/feature/session/types';
import { MoreVerticalIcon, UserCircle2Icon, Trash2Icon } from '@/shared/icons';
import { formatKoreanDateTime } from '@/shared/utils/date';

interface SessionRecordCardProps {
  record: SessionRecord;
  onClick?: (record: SessionRecord) => void;
  onChangeClient?: (record: SessionRecord) => void;
  onDelete?: (record: SessionRecord) => void;
  isActive?: boolean;
}

const getNoteTypeLabel = (type: NoteType): string => {
  switch (type) {
    case 'SOAP':
      return 'SOAP';
    case 'mindthos':
      return '마음토스 상담 노트';
    default:
      return type;
  }
};

export const SessionRecordCard: React.FC<SessionRecordCardProps> = ({
  record,
  onClick,
  onChangeClient,
  onDelete,
  isActive = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isClientSelectorPopupOpen, setIsClientSelectorPopupOpen] =
    React.useState(false);
  const [isClientSelectorFromMenuOpen, setIsClientSelectorFromMenuOpen] =
    React.useState(false);

  const { clients } = useClientList();

  const hasClient = record.client_id && record.client_name !== '고객 없음';
  const displayTitle = hasClient
    ? `${record.client_name} ${record.session_number}회기`
    : `세션 ${record.session_number}회기`;

  const handleCardClick = (e: React.MouseEvent) => {
    // PopUp 영역 클릭 시 카드 클릭 이벤트 무시
    if ((e.target as HTMLElement).closest('[data-popup-wrapper]')) {
      return;
    }
    onClick?.(record);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onDelete?.(record);
  };

  const handleClientSelect = (client: any) => {
    if (client) {
      // TODO: 세션에 클라이언트 할당 로직 추가
      console.log(
        'Assigning client:',
        client,
        'to session:',
        record.session_id
      );
      onChangeClient?.(record);
    }
    // 모든 PopUp 닫기
    setIsClientSelectorFromMenuOpen(false);
    setIsClientSelectorPopupOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <>
      <Card
        className={`cursor-pointer transition-all ${
          isActive
            ? 'border-l-4 border-primary bg-surface shadow-md'
            : 'hover:shadow-lg'
        }`}
        onClick={handleCardClick}
      >
        <Card.Body className="space-y-3 p-6">
          <div className="flex items-start justify-between">
            <Title as="h3" className="flex-1 text-left text-lg font-bold">
              {displayTitle}
            </Title>
            <div className="flex-shrink-0" data-popup-wrapper>
              <PopUp
                open={isMenuOpen}
                onOpenChange={setIsMenuOpen}
                placement="bottom-left"
                trigger={
                  <button
                    type="button"
                    className="rounded-lg p-1 text-fg-muted hover:bg-surface-contrast"
                    aria-label="더보기 메뉴"
                  >
                    <MoreVerticalIcon size={20} />
                  </button>
                }
                content={
                  <div
                    className="space-y-1"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    role="presentation"
                  >
                    <ClientSelector
                      variant="dropdown"
                      trigger={
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-surface-contrast"
                        >
                          <UserCircle2Icon size={18} className="text-fg-muted" />
                          <Text className="text-fg">내담자 변경</Text>
                        </button>
                      }
                      open={isClientSelectorFromMenuOpen}
                      onOpenChange={setIsClientSelectorFromMenuOpen}
                      placement="bottom-left"
                      clients={clients}
                      onSelect={handleClientSelect}
                    />
                    <button
                      onClick={handleDelete}
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-surface-contrast"
                    >
                      <Trash2Icon size={18} className="text-fg-muted" />
                      <Text className="text-fg">상담 기록 삭제</Text>
                    </button>
                  </div>
                }
              />
            </div>
          </div>

          <Text truncate className="line-clamp-2 text-left text-sm text-fg">
            {record.content}
          </Text>

          <div className="flex items-center justify-between gap-3">
            <Text className="text-xs text-fg-muted">
              {formatKoreanDateTime(record.created_at)}
            </Text>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2" data-popup-wrapper>
              <ClientSelector
                variant="dropdown"
                trigger={
                  !hasClient ? (
                    <Badge
                      tone="error"
                      variant="soft"
                      size="md"
                      className="hover:bg-danger/20 cursor-pointer border border-danger transition-all"
                    >
                      고객 미정
                    </Badge>
                  ) : (
                    <div style={{ display: 'none' }} />
                  )
                }
                open={isClientSelectorPopupOpen}
                onOpenChange={setIsClientSelectorPopupOpen}
                placement="bottom-left"
                clients={clients}
                onSelect={handleClientSelect}
              />
            </div>
            <div className="flex gap-2">
              {record.note_types.map((type, index) => (
                <Badge key={index} tone="neutral" variant="solid" size="md">
                  {getNoteTypeLabel(type)}
                </Badge>
              ))}
            </div>
          </div>
        </Card.Body>
      </Card>
    </>
  );
};
