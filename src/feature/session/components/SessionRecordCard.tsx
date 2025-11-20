import React from 'react';

import { MoreVertical } from 'lucide-react';

import { Badge } from '@/components/ui/atoms/Badge';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Card } from '@/components/ui/composites/Card';
import type { SessionRecord, NoteType } from '@/feature/session/types';
import { formatKoreanDateTime } from '@/shared/utils/date';

interface SessionRecordCardProps {
  record: SessionRecord;
  onClick?: (record: SessionRecord) => void;
  onMenuClick?: (record: SessionRecord) => void;
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
  onMenuClick,
  isActive = false,
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
      className={`cursor-pointer transition-all ${
        isActive
          ? 'border-l-4 border-primary bg-surface shadow-md'
          : 'hover:shadow-lg'
      }`}
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

        <Text truncate className="line-clamp-2 text-left text-sm text-fg">
          {record.content}
        </Text>

        <div className="flex items-center justify-between">
          <Text className="text-xs text-fg-muted">
            {formatKoreanDateTime(record.created_at)}
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
