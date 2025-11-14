import React from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Card } from '@/components/ui/composites/Card';
import { TemplateCard } from '@/feature/template/components/TemplateCard';
import { mockTemplates } from '@/feature/template/data/mockData';
import type { TemplateListItem } from '@/feature/template/types';

export const TemplateListPage: React.FC = () => {
  const [templates, setTemplates] =
    React.useState<TemplateListItem[]>(mockTemplates);

  const handleTogglePin = (template: TemplateListItem) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === template.id ? { ...t, pin: !t.pin } : t))
    );
  };

  const handleSetDefault = (template: TemplateListItem) => {
    setTemplates((prev) =>
      prev.map((t) => ({
        ...t,
        is_default: t.id === template.id,
      }))
    );
  };

  const handleRequestTemplate = () => {
    console.log('템플릿 신청하기 클릭');
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-contrast p-12">
      <div className="px-12 py-6 text-left">
        <Title as="h1" className="text-2xl font-bold">
          상담 노트 템플릿
        </Title>
      </div>

      <div className="flex-1 px-8 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onTogglePin={handleTogglePin}
              onSetDefault={handleSetDefault}
            />
          ))}

          <Card className="h-full bg-primary-400">
            <Card.Body className="flex h-full flex-col items-center space-y-4 p-6 text-left">
              <div className="text-left">
                <Title as="h3" className="mb-2 text-lg font-bold text-white">
                  혹시 원하는 양식이 없다면?
                </Title>
                <Text className="text-sm text-white/90">
                  마음토스에 자주 사용하는 템플릿을 신청해보세요.
                  <br />
                  검토 후 추가해드려요.
                </Text>
              </div>
              <Button
                variant="solid"
                tone="neutral"
                size="md"
                onClick={handleRequestTemplate}
                className="bg-white text-accent hover:bg-white/90"
              >
                템플릿 신청하기
              </Button>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TemplateListPage;
