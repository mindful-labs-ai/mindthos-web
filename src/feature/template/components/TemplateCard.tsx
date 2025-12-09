import React from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Card } from '@/components/ui/composites/Card';
import type { TemplateListItem } from '@/feature/template/types';
import { StarIcon } from '@/shared/icons';

export interface TemplateCardProps {
  template: TemplateListItem;
  onTogglePin?: (template: TemplateListItem) => void;
  onSetDefault?: (template: TemplateListItem) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onTogglePin,
  onSetDefault,
}) => {
  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin?.(template);
  };

  const handleDefaultClick = () => {
    if (!template.is_default) {
      onSetDefault?.(template);
    }
  };

  return (
    <Card className="h-64">
      <Card.Body className="flex h-full flex-col space-y-4 p-6 text-left">
        <div className="flex items-start justify-between gap-2">
          <Title as="h3" className="line-clamp-2 flex-1 text-lg font-bold">
            {template.title}
          </Title>
          <button
            type="button"
            onClick={handlePinClick}
            className="flex-shrink-0 text-fg-muted transition-colors hover:text-accent"
            aria-label={template.pin ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          >
            <StarIcon
              size={20}
              fill={template.pin ? 'currentColor' : 'none'}
              className={template.pin ? 'text-accent' : ''}
            />
          </button>
        </div>

        <Text className="flex-1 overflow-y-auto text-left text-sm text-fg">
          {template.description}
        </Text>

        <Button
          tone={template.is_default ? 'primary' : 'neutral'}
          size="sm"
          onClick={handleDefaultClick}
          className="w-1/2"
        >
          {template.is_default ? '기본 노트로 설정함' : '기본 노트로 변경하기'}
        </Button>
      </Card.Body>
    </Card>
  );
};
