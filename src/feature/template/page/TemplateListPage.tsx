import React from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { Card } from '@/components/ui/composites/Card';
import { TemplateCard } from '@/feature/template/components/TemplateCard';
import { useSetDefaultTemplate } from '@/feature/template/hooks/useSetDefaultTemplate';
import { useTemplateList } from '@/feature/template/hooks/useTemplateList';
import { useToggleTemplatePin } from '@/feature/template/hooks/useToggleTemplatePin';
import type { TemplateListItem } from '@/feature/template/types';

export const TemplateListPage: React.FC = () => {
  const { templates, isLoading, error } = useTemplateList();
  const togglePinMutation = useToggleTemplatePin();
  const setDefaultMutation = useSetDefaultTemplate();

  const handleTogglePin = (template: TemplateListItem) => {
    togglePinMutation.mutate(template.id);
  };

  const handleSetDefault = (template: TemplateListItem) => {
    setDefaultMutation.mutate(template.id);
  };

  const handleRequestTemplate = () => {
    // TODO: 템플릿 신청 기능 구현
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-contrast p-12">
      <div className="px-12 py-6 text-left">
        <Title as="h1" className="text-2xl font-bold">
          상담 노트 템플릿
        </Title>
      </div>

      {/* 에러 상태 */}
      {error && (
        <div className="bg-danger/10 mx-8 mb-4 rounded-[var(--radius-md)] px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Text className="text-lg text-fg-muted">로딩 중...</Text>
        </div>
      ) : (
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

            <Card className="h-full bg-gradient-to-r from-green-500 to-amber-200">
              <Card.Body className="flex h-full flex-col items-center space-y-4 p-6 text-left">
                <div className="w-full text-left">
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
                  className="w-full bg-white text-primary-500 hover:bg-white/90"
                >
                  템플릿 신청하기
                </Button>
              </Card.Body>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateListPage;
