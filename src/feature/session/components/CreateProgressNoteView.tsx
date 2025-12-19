import React from 'react';

import { Text } from '@/components/ui/atoms/Text';
import { TemplateCard } from '@/feature/template/components/TemplateCard';
import { useSetDefaultTemplate } from '@/feature/template/hooks/useSetDefaultTemplate';
import { useTemplateList } from '@/feature/template/hooks/useTemplateList';
import { useToggleTemplatePin } from '@/feature/template/hooks/useToggleTemplatePin';
import type { TemplateListItem } from '@/feature/template/types';

interface CreateProgressNoteViewProps {
  sessionId: string;
  transcribedText: string | null;
  usedTemplateIds: number[];
  selectedTemplateId: number | null;
  onTemplateSelect: (templateId: number | null) => void;
}

export const CreateProgressNoteView: React.FC<CreateProgressNoteViewProps> = ({
  transcribedText,
  usedTemplateIds,
  selectedTemplateId,
  onTemplateSelect,
}) => {
  // 템플릿 목록 조회 (pin, is_default 정보 포함)
  const { templates, isLoading, error } = useTemplateList();
  const togglePinMutation = useToggleTemplatePin();
  const setDefaultMutation = useSetDefaultTemplate();

  // 사용 가능한 템플릿 필터링
  const availableTemplates = React.useMemo(() => {
    return templates.filter(
      (template) => !usedTemplateIds.includes(template.id)
    );
  }, [templates, usedTemplateIds]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Text className="text-fg-muted">템플릿 목록을 불러오는 중...</Text>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Text className="text-destructive">{error}</Text>
          <Text className="mt-2 text-sm text-fg-muted">
            페이지를 새로고침하거나 다시 시도해주세요.
          </Text>
        </div>
      </div>
    );
  }

  const handleTogglePin = (template: TemplateListItem) => {
    togglePinMutation.mutate(template.id);
  };

  const handleSetDefault = (template: TemplateListItem) => {
    if (!template.is_default) {
      setDefaultMutation.mutate(template.id);
    }
  };

  const handleSelect = (template: TemplateListItem) => {
    if (!transcribedText) return;

    if (selectedTemplateId === template.id) {
      onTemplateSelect(null);
    } else {
      onTemplateSelect(template.id);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    template: TemplateListItem
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(template);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* 전사 텍스트 없음 경고 */}
      {!transcribedText && (
        <div className="border-warning rounded-lg border p-4">
          <Text className="text-warning-foreground text-sm">
            전사 내용이 없어 상담 노트를 작성할 수 없습니다.
          </Text>
        </div>
      )}

      {/* 템플릿 카드 그리드 */}
      {availableTemplates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {availableTemplates.map((template) => {
            const isSelected = selectedTemplateId === template.id;

            return (
              <div
                key={template.id}
                role="button"
                tabIndex={transcribedText ? 0 : -1}
                className={`relative cursor-pointer transition-all ${
                  !transcribedText
                    ? 'cursor-not-allowed opacity-50'
                    : isSelected
                      ? 'rounded-lg ring-2 ring-primary'
                      : ''
                }`}
                onClick={() => handleSelect(template)}
                onKeyDown={(e) => handleKeyDown(e, template)}
                aria-label={`${template.title} 템플릿 ${isSelected ? '선택됨' : '선택하기'}`}
                aria-disabled={!transcribedText}
              >
                {/* TemplateCard */}
                <TemplateCard
                  template={template}
                  onTogglePin={handleTogglePin}
                  onSetDefault={handleSetDefault}
                />

                {/* 우측 하단 선택 체크 - absolute로 덮기 */}
                <div className="pointer-events-none absolute bottom-6 right-6">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full transition-all ${
                      isSelected
                        ? 'bg-primary'
                        : 'border-2 border-border bg-surface'
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="h-4 w-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center">
          <Text className="text-fg-muted">
            모든 템플릿을 이미 사용했습니다.
          </Text>
        </div>
      )}
    </div>
  );
};
