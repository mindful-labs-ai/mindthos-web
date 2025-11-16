import React from 'react';

import { MoreVertical } from 'lucide-react';

import { Badge } from '@/components/ui/atoms/Badge';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Card } from '@/components/ui/composites/Card';
import type { SessionRecord, NoteType } from '@/feature/session/types';

interface SessionRecordCardProps {
  record: SessionRecord;
  onClick?: (record: SessionRecord) => void;
  onMenuClick?: (record: SessionRecord) => void;
}

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}.${month}.${day}(${weekday}) ${hours}:${minutes}`;
};

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
  onMenuClick,
}) => {
  const handleCardClick = () => {
    onClick?.(record);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMenuClick?.(record);
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg"
      onClick={handleCardClick}
    >
      <Card.Body className="space-y-3 p-6">
        <div className="flex items-start justify-between">
          <Title as="h3" className="text-lg font-bold">
            {record.client_name} {record.session_number}회기
          </Title>
          <button
            type="button"
            onClick={handleMenuClick}
            className="translate-x-3 rounded-lg p-1 text-fg-muted hover:bg-surface-contrast"
            aria-label="더보기 메뉴"
          >
            <MoreVertical size={20} />
          </button>
        </div>

        <Text className="line-clamp-2 text-left text-sm text-fg">
          {record.content}
        </Text>

        <div className="flex items-center justify-between">
          <Text className="text-xs text-fg-muted">
            {formatDateTime(record.created_at)}
          </Text>
          <div className="flex gap-2">
            {record.note_types.map((type, index) => (
              <Badge key={index} tone="success" variant="soft" size="sm">
                {getNoteTypeLabel(type)}
              </Badge>
            ))}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};
