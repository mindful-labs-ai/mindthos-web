import React from 'react';

import { Button, Card, Text, Title } from '@/components/ui';

export interface SessionCardProps {
  title: string;
  content: string;
  date: string;
  onClick?: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  title,
  content,
  date,
  onClick,
}) => {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg"
      onClick={onClick}
    >
      <Card.Body className="space-y-3 p-6">
        <div className="flex items-start justify-between">
          <Title as="h3" className="text-base font-semibold">
            {title}
          </Title>
          <Button
            variant="ghost"
            size="sm"
            tone="primary"
            onClick={(e) => {
              e.stopPropagation();
              console.log('마음토스 상담 노트 클릭');
            }}
          >
            마음토스 상담 노트
          </Button>
        </div>
        <Text className="line-clamp-2 text-sm text-fg-muted">{content}</Text>
        <Text className="text-xs text-fg-muted">{date}</Text>
      </Card.Body>
    </Card>
  );
};
