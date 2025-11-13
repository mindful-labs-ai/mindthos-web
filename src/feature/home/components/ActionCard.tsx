import React from 'react';

import { Card, Text } from '@/components/ui';

export interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  title,
  onClick,
}) => {
  return (
    <Card
      className="h-40 w-64 cursor-pointer px-1 py-4 transition-all hover:shadow-lg"
      onClick={onClick}
    >
      <Card.Body className="flex flex-col items-start justify-center gap-4 p-8 text-center">
        <div className="rounded-xl border-2 border-b border-border p-2">
          {icon}
        </div>
        <Text className="font-medium">{title}</Text>
      </Card.Body>
    </Card>
  );
};
