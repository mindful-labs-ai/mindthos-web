import React from 'react';

import { Badge } from '@/components/ui/atoms/Badge';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Card } from '@/components/ui/composites/Card';
import { PopUp } from '@/components/ui/composites/PopUp';
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

  const handleChangeClient = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onChangeClient?.(record);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onDelete?.(record);
  };

  return (
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
                <div className="space-y-1">
                  <button
                    onClick={handleChangeClient}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-surface-contrast"
                  >
                    <UserCircle2Icon size={18} className="text-fg-muted" />
                    <Text className="text-fg">내담자 변경</Text>
                  </button>
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
          {!hasClient && (
            <Badge
              tone="error"
              variant="soft"
              size="md"
              className="border border-danger"
            >
              고객 미정
            </Badge>
          )}
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
  );
};
