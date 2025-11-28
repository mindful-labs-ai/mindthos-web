import React from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Card } from '@/components/ui/composites/Card';
import type { Template } from '@/feature/template/types';

interface TemplateCardProps {
  template: Template;
  isCreating: boolean;
  disabled: boolean;
  onSelect: () => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isCreating,
  disabled,
  onSelect,
}) => {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <Title as="h3" className="text-lg">
        {template.title}
      </Title>
      <Text className="flex-1 text-sm text-fg-muted">
        {template.description}
      </Text>
      <Button
        variant="solid"
        tone="primary"
        disabled={disabled || isCreating}
        onClick={onSelect}
        className="w-full"
      >
        {isCreating ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75" />
            </svg>
            생성 중...
          </span>
        ) : (
          '상담 노트 만들기'
        )}
      </Button>
    </Card>
  );
};
