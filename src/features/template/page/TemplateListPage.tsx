import React from 'react';

import { useSetDefaultTemplate } from '@/features/template/hooks/useSetDefaultTemplate';
import { useTemplateList } from '@/features/template/hooks/useTemplateList';
import { useToggleTemplatePin } from '@/features/template/hooks/useToggleTemplatePin';
import type { TemplateListItem } from '@/features/template/types';
import { trackEvent } from '@/lib/mixpanel';
import { TEMPLATE_REQUEST_FORM_URL } from '@/shared/constants/externalUrls';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { useDevice } from '@/shared/hooks/useDevice';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';
import { Title } from '@/shared/ui/atoms/Title';
import { Card } from '@/shared/ui/composites/Card';
import { TemplateCard } from '@/widgets/template/TemplateCard';

export const TemplateListPage: React.FC = () => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
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
    trackEvent(MixpanelEvent.TemplateRequestClick);
    window.open(TEMPLATE_REQUEST_FORM_URL, '_blank', 'noopener,noreferrer');
  };

  const gridCols = isMobile
    ? 'grid-cols-1'
    : isTablet
      ? 'grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div
      className={
        isMobileView
          ? 'w-full px-4 py-4 md:px-10 md:py-6'
          : 'mx-auto flex min-h-screen w-full max-w-[1332px] flex-col px-16 py-[42px]'
      }
    >
      {!isMobileView && (
        <div className="text-left">
          <Title as="h1" className="text-2xl font-headline text-grey-100">
            상담노트 양식
          </Title>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="mb-4 rounded-md bg-red-20 px-4 py-3 text-sm text-red-80">
          {error}
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Text className="text-l text-grey-60">로딩 중...</Text>
        </div>
      ) : (
        <div className={isMobileView ? '' : 'flex-1 py-6'}>
          <div className={`grid gap-4 md:gap-6 ${gridCols}`}>
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onTogglePin={handleTogglePin}
                onSetDefault={handleSetDefault}
              />
            ))}

            <Card className="h-[219px] bg-gradient-to-r from-green-500 to-amber-200">
              <Card.Body className="flex h-full flex-col items-center justify-between space-y-4 p-6 text-left">
                <div className="w-full text-left">
                  <h3 className="mb-2 text-l font-headline text-white">
                    혹시 원하는 양식이 없다면?
                  </h3>
                  <p className="text-m text-white/90">
                    마음토스에 자주 사용하는 노트 양식을 신청해보세요.
                    <br />
                    검토 후 추가해드려요.
                  </p>
                </div>
                <Button
                  variant="solid"
                  tone="neutral"
                  size="md"
                  onClick={handleRequestTemplate}
                  className="w-full bg-white text-green-80 lg:hover:bg-white/90"
                >
                  노트 양식 신청하기
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
