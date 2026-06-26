import React from 'react';

import {
  NOTE_FORM_CATEGORY_LABEL,
  groupTemplatesByCategory,
} from '@/features/template/constants/noteCategory';
import { useTemplateList } from '@/features/template/hooks/useTemplateList';
import type { TemplateListItem } from '@/features/template/types';
import { Text } from '@/shared/ui/atoms/Text';

import { NoteTemplateSelectCard } from './NoteTemplateSelectCard';

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

  // 섹션 구성: 즐겨찾기(pin) → 기관 및 센터 제출용 → 이론별 사례개념화.
  // 즐겨찾기한 양식은 즐겨찾기에만(원래 카테고리에서는 제외).
  const sections = React.useMemo(() => {
    const favorites = templates.filter((t) => t.pin);
    const byCategory = groupTemplatesByCategory(
      templates.filter((t) => !t.pin)
    );
    return [
      { key: 'favorites', label: '즐겨찾기 양식', items: favorites },
      {
        key: 'institution',
        label: NOTE_FORM_CATEGORY_LABEL.institution,
        items: byCategory.institution,
      },
      {
        key: 'caseConceptualization',
        label: NOTE_FORM_CATEGORY_LABEL.caseConceptualization,
        items: byCategory.caseConceptualization,
      },
    ].filter((section) => section.items.length > 0);
  }, [templates]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Text className="text-fg-muted">노트 양식 목록을 불러오는 중...</Text>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Text className="text-destructive">{error}</Text>
          <Text className="typo-sm mt-2 text-fg-muted">
            페이지를 새로고침하거나 다시 시도해 주세요.
          </Text>
        </div>
      </div>
    );
  }

  const handleSelect = (template: TemplateListItem) => {
    if (!transcribedText) return;
    onTemplateSelect(selectedTemplateId === template.id ? null : template.id);
  };

  return (
    <div className="mx-auto max-w-[824px] space-y-8 text-left">
      {/* 전사 텍스트 없음 경고 */}
      {!transcribedText && (
        <div className="border-warning rounded-lg border p-4">
          <Text className="text-warning-foreground typo-sm">
            축어록이 없어서 상담노트를 만들 수 없어요.
          </Text>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <Text className="text-fg-muted">
            사용할 수 있는 노트 양식이 없어요.
          </Text>
        </div>
      ) : (
        sections.map((section) => (
          <section key={section.key}>
            <h2 className="text-l font-headline text-grey-100">
              {section.label}
            </h2>
            <div className="mt-5 flex flex-wrap gap-6">
              {section.items.map((template) => (
                <NoteTemplateSelectCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplateId === template.id}
                  isUsed={usedTemplateIds.includes(template.id)}
                  disabled={!transcribedText}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
};
